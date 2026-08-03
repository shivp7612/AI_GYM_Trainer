# main.py
import cv2
import os  # 🔥 Added to check if video files exist
import argparse
import time
import datetime
import sqlite3
from config import CAMERA_INDEX, WINDOW_NAME
from core.pose_detector import PoseDetector
from core.injury_detection import InjuryDetector
from core.exercise_verifier import ExerciseVerifier
from exercises.motion_profiler import MotionProfiler
from exercises.exercise_dict import WORKOUT_PLAN, ALL_EXERCISES
from utils.angles import calculate_angle
from utils.display import draw_dashboard

# Parse command line arguments
parser = argparse.ArgumentParser()
parser.add_argument('--user_id', type=int, default=1, help='User ID')
parser.add_argument('--exercise', type=str, default='', help='Exercise key to start directly')
args, unknown = parser.parse_known_args()
USER_ID = args.user_id

# Fetch user experience and determine targets
target_sets = 4
target_reps = 12
rest_duration = 90
try:
    db_path = 'gym_trainer.db'
    if not os.path.exists(db_path) and os.path.exists('backend/gym_trainer.db'):
        db_path = 'backend/gym_trainer.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT experience FROM user_profiles WHERE user_id = ?', (USER_ID,))
    profile_row = cursor.fetchone()
    conn.close()
    
    if profile_row and profile_row[0]:
        experience = profile_row[0]
        if experience == "Beginner":
            target_sets = 3
            target_reps = 10
            rest_duration = 75
        elif experience == "Advanced":
            target_sets = 5
            target_reps = 12
            rest_duration = 120
except Exception as e:
    print(f"Error fetching profile: {e}")

def save_workout_session(user_id, exercise, reps, sets, duration_mins, accuracy_pct):
    """Saves session metrics directly to the SQLite gym database."""
    if reps <= 0:
        return
    try:
        db_path = 'gym_trainer.db'
        # Handle cases where backend folder has the DB or root has it
        if not os.path.exists(db_path) and os.path.exists('backend/gym_trainer.db'):
            db_path = 'backend/gym_trainer.db'
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Calculate calories
        calories = round(duration_mins * 7.5, 1)
        fatigue = 40.0
        risk = "Low"
        if accuracy_pct < 75:
            risk = "Medium"
            
        now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f')
        
        # Log workout history
        cursor.execute('''
            INSERT INTO workout_histories (user_id, exercise, reps, sets, duration, accuracy, date, calories_burned, avg_fatigue, risk_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, exercise, reps, sets, duration_mins, accuracy_pct, now, calories, fatigue, risk))
        
        # Query profile metrics
        cursor.execute('SELECT weight, bmi FROM user_profiles WHERE user_id = ?', (user_id,))
        profile = cursor.fetchone()
        weight, bmi = 70.0, 22.8
        if profile:
            weight, bmi = profile[0], profile[1]
            
        # Log progress log
        cursor.execute('''
            INSERT INTO progress_logs (user_id, date, weight, bmi, calories_burned, duration)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, now, weight, bmi, calories, duration_mins))
        
        # Update daily intake calories
        today = datetime.date.today().strftime('%Y-%m-%d')
        cursor.execute('SELECT id, calories_kcal FROM daily_intakes WHERE user_id = ? AND date = ?', (user_id, today))
        intake = cursor.fetchone()
        if intake:
            new_cals = intake[1] + int(calories)
            cursor.execute('UPDATE daily_intakes SET calories_kcal = ? WHERE id = ?', (new_cals, intake[0]))
        else:
            cursor.execute('INSERT INTO daily_intakes (user_id, date, water_liters, protein_grams, calories_kcal) VALUES (?, ?, 0.0, 0, ?)', (user_id, today, int(calories)))
            
        conn.commit()
        conn.close()
        print(f"Logged Local Session: {exercise} | Reps: {reps} | Sets: {sets} | Accuracy: {int(accuracy_pct)}%")
    except Exception as e:
        print(f"Database logging exception: {str(e)}")

# Set the window to scale and show initial loading screen
cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
fullscreen_set = False

import numpy as np
loading_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
cv2.putText(loading_frame, "Initializing AI Gym Trainer...", (340, 320), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
cv2.putText(loading_frame, "Loading camera stream, please wait...", (360, 380), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)
cv2.imshow(WINDOW_NAME, loading_frame)
cv2.waitKey(50)  # Render loading screen instantly

# Initialize Modules
print(f"Initializing webcam index: {CAMERA_INDEX}...")
# Try DirectShow (cv2.CAP_DSHOW) first on Windows as it is much more robust and fast
cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)

# Fallback if DirectShow fails to open at all
if not cap.isOpened():
    cap.release()
    cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print(f"\n❌ ERROR: Could not open webcam at index {CAMERA_INDEX}.")
    print("👉 Another app (like Chrome, Edge, or Zoom) might be using your camera. Please close any tabs/apps using the webcam!")
    print("👉 If you have multiple webcams, edit 'config.py' and change CAMERA_INDEX to 1 or 2.")
    input("\nPress ENTER to exit...")
    exit(1)

# Request High Definition from your webcam
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

detector = PoseDetector()
profiler = MotionProfiler()
injury_detector = InjuryDetector()
verifier = ExerciseVerifier()

# App State Management
categories = list(WORKOUT_PLAN.keys())
selected_category = ""
exercises_in_category = []
current_exercise = ""
demo_cap = None 

if args.exercise:
    # Find the category containing the specified exercise
    found = False
    for cat, ex_dict in WORKOUT_PLAN.items():
        if args.exercise in ex_dict:
            selected_category = cat
            exercises_in_category = list(ex_dict.keys())
            current_exercise = args.exercise
            found = True
            break
            
    if found:
        # Check for Demo Video
        video_path = f"assets/videos/{current_exercise}.mp4"
        if os.path.exists(video_path):
            demo_cap = cv2.VideoCapture(video_path)
            app_state = "DEMO_VIDEO"
        else:
            app_state = "TRACKING"
    else:
        print(f"⚠️ Warning: Specified exercise '{args.exercise}' not found in WORKOUT_PLAN. Falling back to menu.")
        app_state = "MENU_CATEGORY"
else:
    app_state = "MENU_CATEGORY"

# Session tracking helpers
session_active = False
session_start_time = 0
session_accuracies = []
session_reps = 0
session_sets = 1 
completed_sets = 0
total_reps = 0
rest_start_time = 0 

while True:
    ret, frame = cap.read()
    if not ret:
        print("\n❌ ERROR: Webcam frame read failed. The camera may have been unplugged or is locked by another process.")
        input("\nPress ENTER to exit...")
        break

    # Flip webcam frame horizontally for a mirror effect
    frame = cv2.flip(frame, 1)
    key = cv2.waitKey(1) & 0xFF

    # -------------------------------------
    # 1. UI: MUSCLE GROUP MENU
    # -------------------------------------
    if app_state == "MENU_CATEGORY":
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.8, frame, 0.2, 0)

        cv2.putText(frame, "SELECT MUSCLE GROUP:", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        
        for i, category in enumerate(categories):
            cv2.putText(frame, f"{i+1}. {category}", (50, 100 + (i * 40)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        if ord('1') <= key <= ord(str(len(categories))):
            index = key - ord('1')
            selected_category = categories[index]
            exercises_in_category = list(WORKOUT_PLAN[selected_category].keys())
            app_state = "MENU_EXERCISE"

    # -------------------------------------
    # 2. UI: EXERCISE MENU
    # -------------------------------------
    elif app_state == "MENU_EXERCISE":
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.8, frame, 0.2, 0)

        cv2.putText(frame, f"{selected_category.upper()} EXERCISES:", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        
        for i, ex_name in enumerate(exercises_in_category):
            clean_name = ex_name.replace("_", " ").title()
            cv2.putText(frame, f"{i+1}. {clean_name}", (50, 100 + (i * 40)), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
        cv2.putText(frame, "Press 'B' to go back", (50, frame.shape[0] - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        if ord('1') <= key <= ord(str(min(9, len(exercises_in_category)))): 
            index = key - ord('1')
            current_exercise = exercises_in_category[index]
            profiler.count = 0  
            profiler.stage = "-"
            verifier.reset()  # 🔥 Reset verifier for each new exercise
            
            # 🔥 NEW LOGIC: Check for Demo Video before going to tracking
            video_path = f"assets/videos/{current_exercise}.mp4"
            if os.path.exists(video_path):
                demo_cap = cv2.VideoCapture(video_path)
                app_state = "DEMO_VIDEO"
            else:
                app_state = "TRACKING" # Skip straight to tracking if no video is found

        elif key == ord('b') or key == ord('B'):
            app_state = "MENU_CATEGORY"

    # -------------------------------------
    # 🔥 3. NEW STATE: DEMO VIDEO PLAYBACK
    # -------------------------------------
    elif app_state == "DEMO_VIDEO":
        ret_demo, demo_frame = demo_cap.read()
        
        if not ret_demo:
            # Video reached the end
            demo_cap.release()
            app_state = "TRACKING"
        else:
            # Resize the video to fill the screen
            demo_frame = cv2.resize(demo_frame, (frame.shape[1], frame.shape[0]))
            
            # Add UI instructions over the video
            cv2.rectangle(demo_frame, (0, 0), (frame.shape[1], 80), (0, 0, 0), cv2.FILLED)
            clean_name = current_exercise.replace("_", " ").upper()
            cv2.putText(demo_frame, f"DEMO: {clean_name}", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            cv2.putText(demo_frame, "Press 'S' to Skip ->", (frame.shape[1] - 300, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            
            # Override the webcam frame with the video frame
            frame = demo_frame
            
            # Allow user to skip the video manually
            if key == ord('s') or key == ord('S'):
                demo_cap.release()
                app_state = "TRACKING"

    # -------------------------------------
    # 4. CORE TRACKING ENGINE
    # -------------------------------------
    elif app_state == "TRACKING":
        if not session_active:
            session_active = True
            session_start_time = time.time()
            session_accuracies = []
            session_reps = 0
            session_sets = 1
            completed_sets = 0
            total_reps = 0
            profiler.count = 0
            profiler.stage = "-"
            profiler.last_rep_time = time.time() + 1.5
            profiler.stage_up_time = time.time() + 1.5
            
        frame = detector.findPose(frame, draw=True)
        lmList = detector.getLandmarks(frame)

        if len(lmList) > 28:
            if time.time() - session_start_time < 1.5:
                warning_msg = "Preparing tracker... Please get into position"
                clean_name = current_exercise.replace("_", " ")
                frame = draw_dashboard(frame, clean_name, profiler.count, profiler.stage,
                                       0, "Get ready", 0, warning_msg, "",
                                       target_reps=target_reps, target_sets=target_sets, current_set=completed_sets + 1)
                cv2.imshow(WINDOW_NAME, frame)
                if not fullscreen_set:
                    cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                    fullscreen_set = True
                if key == 27:
                    if session_active:
                        duration_mins = (time.time() - session_start_time) / 60.0
                        save_workout_session(USER_ID, current_exercise, 0, 0, duration_mins, 85)
                    break
                continue

            stats = ALL_EXERCISES[current_exercise]
            req_joint = stats["joint"]

            l_shoulder, r_shoulder = lmList[11], lmList[12]
            l_elbow, r_elbow = lmList[13], lmList[14]
            l_wrist, r_wrist = lmList[15], lmList[16]
            l_hip, r_hip = lmList[23], lmList[24]
            l_knee, r_knee = lmList[25], lmList[26]
            l_ankle, r_ankle = lmList[27], lmList[28]

            # ── Joint Visibility Check ─────────────────────────────
            left_indices = [11, 13, 15] # default: elbow joint requires shoulders, elbows, wrists
            right_indices = [12, 14, 16]
            if req_joint == "knee":
                left_indices = [23, 25, 27]
                right_indices = [24, 26, 28]
            elif req_joint == "hip":
                left_indices = [11, 23, 25]
                right_indices = [12, 24, 26]
            elif req_joint == "shoulder":
                left_indices = [23, 11, 13]
                right_indices = [24, 12, 14]
            elif req_joint == "wrist":
                left_indices = [13, 15, 17]
                right_indices = [14, 16, 18]

            visibility_threshold = 0.25

            left_visible = True
            for idx in left_indices:
                if idx < len(lmList):
                    if lmList[idx][4] < visibility_threshold:
                        left_visible = False
                        break
                else:
                    left_visible = False
                    break

            right_visible = True
            for idx in right_indices:
                if idx < len(lmList):
                    if lmList[idx][4] < visibility_threshold:
                        right_visible = False
                        break
                else:
                    right_visible = False
                    break

            joints_visible = left_visible or right_visible

            if not joints_visible:
                # Joints not fully in frame — lock reps, show warning banner
                warning_msg = "Please step back: show required joints in camera frame"
                clean_name = current_exercise.replace("_", " ")
                frame = draw_dashboard(frame, clean_name, profiler.count, profiler.stage,
                                       0, "Joints out of frame", 0, warning_msg, "",
                                       target_reps=target_reps, target_sets=target_sets, current_set=completed_sets + 1)
            else:
                active_angle = 0

                if req_joint == "elbow":
                    l_arm = calculate_angle(l_shoulder[1:3], l_elbow[1:3], l_wrist[1:3])
                    r_arm = calculate_angle(r_shoulder[1:3], r_elbow[1:3], r_wrist[1:3])
                    if left_visible and right_visible:
                        active_angle = min(l_arm, r_arm) 
                    elif left_visible:
                        active_angle = l_arm
                    else:
                        active_angle = r_arm

                elif req_joint == "knee":
                    l_leg = calculate_angle(l_hip[1:3], l_knee[1:3], l_ankle[1:3])
                    r_leg = calculate_angle(r_hip[1:3], r_knee[1:3], r_ankle[1:3])
                    if left_visible and right_visible:
                        active_angle = min(l_leg, r_leg)
                    elif left_visible:
                        active_angle = l_leg
                    else:
                        active_angle = r_leg
                    
                elif req_joint == "hip":
                    l_hinge = calculate_angle(l_shoulder[1:3], l_hip[1:3], l_knee[1:3])
                    r_hinge = calculate_angle(r_shoulder[1:3], r_hip[1:3], r_knee[1:3])
                    if left_visible and right_visible:
                        active_angle = min(l_hinge, r_hinge)
                    elif left_visible:
                        active_angle = l_hinge
                    else:
                        active_angle = r_hinge

                elif req_joint == "shoulder":
                    l_raise = calculate_angle(l_hip[1:3], l_shoulder[1:3], l_elbow[1:3])
                    r_raise = calculate_angle(r_hip[1:3], r_shoulder[1:3], r_elbow[1:3]) 
                    if left_visible and right_visible:
                        active_angle = max(l_raise, r_raise)
                    elif left_visible:
                        active_angle = l_raise
                    else:
                        active_angle = r_raise
                    
                elif req_joint == "wrist":
                    l_wrist_ang = calculate_angle(l_elbow[1:3], l_wrist[1:3], lmList[17][1:3])
                    r_wrist_ang = calculate_angle(r_elbow[1:3], r_wrist[1:3], lmList[18][1:3])
                    if left_visible and right_visible:
                        active_angle = min(l_wrist_ang, r_wrist_ang)
                    elif left_visible:
                        active_angle = l_wrist_ang
                    else:
                        active_angle = r_wrist_ang 

                # ── Exercise Verification Gate ───────────────────────
                is_verified, verify_msg = verifier.verify(current_exercise, lmList)

                if not is_verified:
                    # Wrong exercise — show banner, lock reps, skip scoring
                    warning_msg = injury_detector.check_form(current_exercise, lmList)
                    clean_name = current_exercise.replace("_", " ")
                    frame = draw_dashboard(frame, clean_name, profiler.count, profiler.stage,
                                           0, "Do correct exercise!", 0, warning_msg, verify_msg,
                                           target_reps=target_reps, target_sets=target_sets, current_set=completed_sets + 1)
                else:
                    # ── Correct exercise confirmed — count reps & score ─
                    reps, stage = profiler.update_reps(active_angle, stats["up"], stats["down"])
                    score = int(100 - (abs(stats["ideal"] - active_angle) * 1.5))
                    score = max(0, min(100, score))

                    session_reps = total_reps + reps
                    session_accuracies.append(score)

                    # Check if set is complete
                    if reps >= target_reps:
                        completed_sets += 1
                        total_reps += reps
                        profiler.count = 0
                        profiler.stage = "-"
                        
                        if completed_sets >= target_sets:
                            # Save and return to menu
                            duration_mins = (time.time() - session_start_time) / 60.0
                            avg_accuracy = int(sum(session_accuracies) / len(session_accuracies)) if session_accuracies else 85
                            save_workout_session(USER_ID, current_exercise, total_reps, completed_sets, duration_mins, avg_accuracy)
                            session_active = False
                            app_state = "MENU_CATEGORY"
                        else:
                            app_state = "REST_BREAK"
                            rest_start_time = time.time()
                    else:
                        progress_range = abs(stats["up"] - stats["down"])
                        progress = int(abs(active_angle - stats["up"]) / progress_range * 100) if progress_range != 0 else 0
                        progress = max(0, min(100, progress))

                        if score > 85: tip = "Perfect!"
                        elif active_angle > stats["up"]: tip = "Extend fully"
                        elif active_angle < stats["down"]: tip = "Good depth"
                        else: tip = "Keep going"

                        warning_msg = injury_detector.check_form(current_exercise, lmList)
                        clean_name = current_exercise.replace("_", " ")
                        frame = draw_dashboard(frame, clean_name, reps, stage, score, tip, progress, warning_msg, "",
                                               target_reps=target_reps, target_sets=target_sets, current_set=completed_sets + 1)

        if key == ord('m') or key == ord('M'):
            if session_active:
                duration_mins = (time.time() - session_start_time) / 60.0
                avg_accuracy = int(sum(session_accuracies) / len(session_accuracies)) if session_accuracies else 85
                save_workout_session(USER_ID, current_exercise, total_reps + profiler.count, completed_sets, duration_mins, avg_accuracy)
                session_active = False
            app_state = "MENU_CATEGORY"

    # -------------------------------------
    # 🔥 5. REST BREAK STATE
    # -------------------------------------
    elif app_state == "REST_BREAK":
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (frame.shape[1], frame.shape[0]), (0, 0, 0), -1)
        frame = cv2.addWeighted(overlay, 0.75, frame, 0.25, 0)

        elapsed = time.time() - rest_start_time
        remaining = int(rest_duration - elapsed)

        if remaining <= 0 or key == ord('s') or key == ord('S'):
            app_state = "TRACKING"
            session_start_time = time.time()
        elif key == ord('m') or key == ord('M'):
            duration_mins = (time.time() - session_start_time) / 60.0
            avg_accuracy = int(sum(session_accuracies) / len(session_accuracies)) if session_accuracies else 85
            save_workout_session(USER_ID, current_exercise, total_reps, completed_sets, duration_mins, avg_accuracy)
            session_active = False
            app_state = "MENU_CATEGORY"
        else:
            h_f, w_f, _ = frame.shape
            cv2.putText(frame, "REST BREAK", (w_f // 2 - 120, h_f // 2 - 120), cv2.FONT_HERSHEY_DUPLEX, 1.2, (0, 255, 255), 3)
            cv2.putText(frame, f"Set {completed_sets} of {target_sets} Completed!", (w_f // 2 - 180, h_f // 2 - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            cv2.putText(frame, "Take a deep breath and rest...", (w_f // 2 - 200, h_f // 2 - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (150, 150, 150), 1)
            
            circle_x = w_f // 2
            circle_y = h_f // 2 + 50
            cv2.circle(frame, (circle_x, circle_y), 60, (255, 0, 255), 4)
            cv2.putText(frame, f"{remaining}s", (circle_x - 30, circle_y + 10), cv2.FONT_HERSHEY_DUPLEX, 1.0, (0, 255, 0), 2)

            cv2.putText(frame, "Press 'S' to skip rest", (w_f // 2 - 150, h_f // 2 + 160), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(frame, "Press 'M' to exit to menu", (w_f // 2 - 170, h_f // 2 + 200), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

    cv2.imshow(WINDOW_NAME, frame)
    if not fullscreen_set:
        cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        fullscreen_set = True

    if key == 27: 
        if session_active:
            duration_mins = (time.time() - session_start_time) / 60.0
            avg_accuracy = int(sum(session_accuracies) / len(session_accuracies)) if session_accuracies else 85
            save_workout_session(USER_ID, current_exercise, total_reps + profiler.count, completed_sets, duration_mins, avg_accuracy)
            session_active = False
        break # ESC key to exit

cap.release()
if demo_cap is not None:
    demo_cap.release()
cv2.destroyAllWindows()