# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
import shutil
import datetime
from typing import List, Dict, Any

from backend.database import get_db, engine, Base
import backend.models as models
import backend.schemas as schemas
from backend.ai_logic.planner import calculate_profile_metrics, generate_workout_plan, generate_diet_plan
from backend.ai_logic.readiness import calculate_readiness_score
from backend.ai_logic.chatbot import respond_to_chat
from backend.ai_logic.report_generator import generate_pdf_report
from backend.ai_logic.socket_manager import WorkoutSocketSession

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Gym Trainer API")

# Add CORS middleware to allow connection from React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory configuration
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# --- AUTH & REGISTRATION ---

@app.post("/api/register", response_model=schemas.UserResponse)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.name == user_in.name).first()
    if db_user:
        return db_user
    new_user = models.User(name=user_in.name)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# --- ONBOARDING & PROFILE ---

@app.post("/api/profile", response_model=schemas.UserProfileResponse)
def create_profile(profile_in: schemas.UserProfileCreate, user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate target calories, protein, etc. based on goals
    metrics = calculate_profile_metrics(
        age=profile_in.age,
        gender=profile_in.gender,
        height=profile_in.height,
        weight=profile_in.weight,
        goal=profile_in.goal
    )

    db_profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if db_profile:
        # Update existing profile
        db_profile.age = profile_in.age
        db_profile.gender = profile_in.gender
        db_profile.height = profile_in.height
        db_profile.weight = profile_in.weight
        db_profile.goal = profile_in.goal
        db_profile.experience = profile_in.experience
        db_profile.equipment = profile_in.equipment
        db_profile.injury = profile_in.injury
        db_profile.workout_days = profile_in.workout_days
    else:
        # Create new profile
        db_profile = models.UserProfile(user_id=user_id, **profile_in.dict())
        db.add(db_profile)

    # Assign calculated metrics
    db_profile.bmi = metrics["bmi"]
    db_profile.body_fat_est = metrics["body_fat_est"]
    db_profile.target_calories = metrics["target_calories"]
    db_profile.target_protein = metrics["target_protein"]
    db_profile.target_water = metrics["target_water"]
    db_profile.sleep_hours = metrics["sleep_hours"]
    db_profile.target_weight = metrics["target_weight"]
    db_profile.goal_time_weeks = metrics["goal_time_weeks"]

    db.commit()
    db.refresh(db_profile)
    return db_profile


@app.get("/api/profile/{user_id}", response_model=schemas.UserProfileResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding first.")
    return profile


# --- DASHBOARD & INTAKE LOGS ---

@app.get("/api/dashboard/{user_id}")
def get_dashboard_summary(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = user.profile
    if not profile:
        raise HTTPException(status_code=400, detail="Onboarding not completed")

    # Fetch daily nutrition intake for today
    today = datetime.date.today()
    intake = db.query(models.DailyIntake).filter(
        models.DailyIntake.user_id == user_id,
        models.DailyIntake.date == today
    ).first()

    if not intake:
        intake = models.DailyIntake(user_id=user_id, date=today, water_liters=0.0, protein_grams=0, calories_kcal=0)
        db.add(intake)
        db.commit()
        db.refresh(intake)

    # Generate custom training regimes
    workout_regime = generate_workout_plan(
        experience=profile.experience,
        goal=profile.goal,
        equipment=profile.equipment,
        injuries=profile.injury,
        workout_days=profile.workout_days
    )

    # Generate custom Indian diet suggestions
    diet_regime = generate_diet_plan(goal=profile.goal, weight=profile.weight)

    # Calculate mock progress metrics for dashboards
    # Count how many sessions performed in past 30 days
    past_month = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    monthly_workouts = db.query(models.WorkoutHistory).filter(
        models.WorkoutHistory.user_id == user_id,
        models.WorkoutHistory.date >= past_month
    ).count()

    streak = 14  # Default static polished workout streak
    completion_rate = min(100, int((monthly_workouts / (profile.workout_days * 4)) * 100)) if monthly_workouts > 0 else 0
    completion_rate = max(10, completion_rate)  # keep a minimum value for visuals

    # Today's day name to fetch plan
    today_name = datetime.date.today().strftime("%A")
    todays_workout = workout_regime["schedule"].get(today_name, {"name": "Rest Day", "exercises": []})

    return {
        "user_name": user.name,
        "metrics": {
            "bmi": profile.bmi,
            "body_fat_est": profile.body_fat_est,
            "sleep_hours": profile.sleep_hours,
            "target_weight": profile.target_weight,
            "goal_time_weeks": profile.goal_time_weeks,
        },
        "goals": {
            "calories_target": profile.target_calories,
            "protein_target": profile.target_protein,
            "water_target": profile.target_water,
        },
        "intake_today": {
            "calories": intake.calories_kcal,
            "protein": intake.protein_grams,
            "water": intake.water_liters,
        },
        "workout_streak": streak,
        "workout_completion": completion_rate,
        "today_workout_name": todays_workout["name"],
        "today_exercises": todays_workout["exercises"],
        "workout_details": {
            "sets": workout_regime["sets"],
            "reps": workout_regime["reps"],
            "rest_timer": workout_regime["rest_timer"],
            "description": workout_regime["description"],
            "injury_swaps": workout_regime["injury_swaps"]
        },
        "diet_meals": diet_regime["meals"],
        "diet_macros_target": {
            "carbs": diet_regime["carbs"],
            "fat": diet_regime["fat"]
        }
    }


@app.post("/api/intake/{user_id}", response_model=schemas.DailyIntakeResponse)
def update_daily_intake(user_id: int, update: schemas.DailyIntakeUpdate, db: Session = Depends(get_db)):
    today = datetime.date.today()
    intake = db.query(models.DailyIntake).filter(
        models.DailyIntake.user_id == user_id,
        models.DailyIntake.date == today
    ).first()

    if not intake:
        intake = models.DailyIntake(user_id=user_id, date=today)
        db.add(intake)

    if update.water_liters is not None:
        intake.water_liters = round(intake.water_liters + update.water_liters, 1)
    if update.protein_grams is not None:
        intake.protein_grams = max(0, intake.protein_grams + update.protein_grams)
    if update.calories_kcal is not None:
        intake.calories_kcal = max(0, intake.calories_kcal + update.calories_kcal)

    db.commit()
    db.refresh(intake)
    return intake


# --- PRE-WORKOUT READINESS ---

@app.post("/api/readiness/{user_id}")
def check_readiness(user_id: int, readiness_in: schemas.ReadinessCheck, db: Session = Depends(get_db)):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    result = calculate_readiness_score(
        sleep_hours=readiness_in.sleep_hours,
        soreness_level=readiness_in.soreness_level,
        energy_level=readiness_in.energy_level
    )
    return result


from exercises.exercise_dict import WORKOUT_PLAN

# --- WORKOUT SESSIONS ---

@app.get("/api/workout/exercises")
def get_exercises():
    return WORKOUT_PLAN

@app.post("/api/workout/start_local/{user_id}")
def start_local_workout(user_id: int, payload: schemas.StartWorkoutRequest):
    import subprocess
    import sys
    try:
        cmd = [sys.executable, "main.py", "--user_id", str(user_id), "--exercise", payload.exercise]
        subprocess.Popen(cmd, cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        return {"status": "success", "message": f"Local tracking engine started for {payload.exercise}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start local tracking engine: {str(e)}")

@app.post("/api/workout/finish/{user_id}", response_model=schemas.WorkoutHistoryResponse)
def finish_workout(user_id: int, history_in: schemas.WorkoutHistoryCreate, db: Session = Depends(get_db)):
    # Log session to database
    db_history = models.WorkoutHistory(user_id=user_id, **history_in.dict())
    db.add(db_history)

    # Log weight & calorie burns to progress log
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if profile:
        prog_log = models.ProgressLog(
            user_id=user_id,
            weight=profile.weight,
            bmi=profile.bmi,
            calories_burned=history_in.calories_burned,
            duration=history_in.duration
        )
        db.add(prog_log)
        
        # Log to daily calories burned intake
        today = datetime.date.today()
        intake = db.query(models.DailyIntake).filter(
            models.DailyIntake.user_id == user_id,
            models.DailyIntake.date == today
        ).first()
        if intake:
            intake.calories_kcal = max(0, intake.calories_kcal + int(history_in.calories_burned))

    db.commit()
    db.refresh(db_history)
    return db_history


@app.get("/api/workout/history/{user_id}", response_model=List[schemas.WorkoutHistoryResponse])
def get_workout_history(user_id: int, db: Session = Depends(get_db)):
    history = db.query(models.WorkoutHistory).filter(models.WorkoutHistory.user_id == user_id).order_by(models.WorkoutHistory.date.desc()).all()
    return history


@app.get("/api/workout/analytics/{user_id}")
def get_analytics(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(models.ProgressLog).filter(models.ProgressLog.user_id == user_id).order_by(models.ProgressLog.date.asc()).all()
    histories = db.query(models.WorkoutHistory).filter(models.WorkoutHistory.user_id == user_id).order_by(models.WorkoutHistory.date.asc()).all()

    # Weight tracking graph (Week weight data)
    weight_data = []
    weight_labels = []
    
    # Base fallback labels if no history exists yet
    if not logs:
        weight_labels = ["Week 1", "Week 2", "Week 3", "Week 4"]
        weight_data = [72.0, 71.0, 70.0, 69.0]
    else:
        for log in logs:
            weight_labels.append(log.date.strftime("%m/%d"))
            weight_data.append(log.weight)

    # General history arrays
    calories = [h.calories_burned for h in histories] if histories else [350, 420, 310, 520]
    durations = [h.duration for h in histories] if histories else [40, 48, 35, 55]
    accuracies = [h.accuracy for h in histories] if histories else [88, 92, 85, 91]
    dates = [h.date.strftime("%m/%d") for h in histories] if histories else ["07/04", "07/06", "07/08", "07/10"]

    return {
        "weight_labels": weight_labels,
        "weight_data": weight_data,
        "calories": calories,
        "durations": durations,
        "accuracies": accuracies,
        "dates": dates
    }


@app.get("/api/workout/report/{user_id}/{session_id}")
def download_pdf_report(user_id: int, session_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session_log = db.query(models.WorkoutHistory).filter(
        models.WorkoutHistory.user_id == user_id,
        models.WorkoutHistory.id == session_id
    ).first()
    
    if not session_log:
        raise HTTPException(status_code=404, detail="Session log not found")

    # Generate mock sub-exercise details to fill out the table
    # This maps the overall session to standard details
    mock_exercises_details = [
        {
            "exercise": session_log.exercise,
            "sets": session_log.sets,
            "reps": session_log.reps,
            "accuracy": int(session_log.accuracy),
            "risk": session_log.risk_score
        }
    ]

    session_summary = {
        "duration": session_log.duration,
        "calories_burned": session_log.calories_burned,
        "avg_accuracy": int(session_log.accuracy),
        "avg_fatigue": int(session_log.avg_fatigue),
        "risk_level": session_log.risk_score
    }

    # Store file temporarily
    filename = f"workout_report_{user_id}_{session_id}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    generate_pdf_report(
        user_name=user.name,
        profile_goal=user.profile.goal if user.profile else "General Fitness",
        session=session_summary,
        exercises=mock_exercises_details,
        file_path=file_path
    )

    from fastapi.responses import FileResponse
    return FileResponse(file_path, filename=filename, media_type="application/pdf")


# --- CHAT ASSISTANT ---

@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_assistant(chat_msg: schemas.ChatMessage):
    reply = respond_to_chat(chat_msg.message)
    return schemas.ChatResponse(reply=reply)


# --- PROGRESS PHOTOS ---

@app.post("/api/photos/upload/{user_id}", response_model=schemas.ProgressPhotoResponse)
async def upload_progress_photo(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"progress_{user_id}_{timestamp}{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Log in database
    photo_entry = models.ProgressPhoto(
        user_id=user_id,
        photo_path=f"/uploads/{filename}" # HTTP path accessible from frontend CORS
    )
    db.add(photo_entry)
    db.commit()
    db.refresh(photo_entry)
    return photo_entry


@app.get("/api/photos/{user_id}", response_model=List[schemas.ProgressPhotoResponse])
def get_progress_photos(user_id: int, db: Session = Depends(get_db)):
    photos = db.query(models.ProgressPhoto).filter(models.ProgressPhoto.user_id == user_id).order_by(models.ProgressPhoto.date.desc()).all()
    return photos


# --- WEBSOCKET REAL-TIME AI ENGINE ---

@app.websocket("/ws/track/{user_id}")
async def websocket_tracking_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    
    session = WorkoutSocketSession()
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_json()
            
            event = data.get("event")
            if event == "config":
                # User starts an exercise
                exercise_name = data.get("exercise", "")
                session.set_exercise(exercise_name)
                await websocket.send_json({"status": "ready", "exercise": exercise_name})
                
            elif event == "frame":
                image_b64 = data.get("image", "")
                
                # Check for updates from frontend (if rest or sets changes)
                if "exercise" in data:
                    session.set_exercise(data.get("exercise"))
                    
                result = session.process_frame(image_b64)
                await websocket.send_json(result)
                
            elif event == "finish":
                # Session complete, send final stats
                summary = session.get_summary_metrics()
                await websocket.send_json({"event": "summary", "data": summary})
                
    except WebSocketDisconnect:
        # Gracefully handle disconnects
        pass
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
