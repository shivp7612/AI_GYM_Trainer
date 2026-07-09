# main.py
import cv2
import os  # 🔥 Added to check if video files exist
from config import CAMERA_INDEX, WINDOW_NAME
from core.pose_detector import PoseDetector
from core.injury_detection import InjuryDetector
from core.exercise_verifier import ExerciseVerifier
from exercises.motion_profiler import MotionProfiler
from exercises.exercise_dict import WORKOUT_PLAN, ALL_EXERCISES
from utils.angles import calculate_angle
from utils.display import draw_dashboard

# Initialize Modules
cap = cv2.VideoCapture(CAMERA_INDEX)

# Request High Definition from your webcam
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

detector = PoseDetector()
profiler = MotionProfiler()
injury_detector = InjuryDetector()
verifier = ExerciseVerifier()

# Set the window to scale and force True Full Screen
cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
cv2.setWindowProperty(WINDOW_NAME, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

# App State Management
app_state = "MENU_CATEGORY"
categories = list(WORKOUT_PLAN.keys())
selected_category = ""
exercises_in_category = []
current_exercise = ""

# 🔥 Variable to hold the demo video
demo_cap = None 

while True:
    ret, frame = cap.read()
    if not ret: break

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
        frame = detector.findPose(frame, draw=True)
        lmList = detector.getLandmarks(frame)

        if len(lmList) > 28:
            stats = ALL_EXERCISES[current_exercise]
            req_joint = stats["joint"]

            l_shoulder, r_shoulder = lmList[11], lmList[12]
            l_elbow, r_elbow = lmList[13], lmList[14]
            l_wrist, r_wrist = lmList[15], lmList[16]
            l_hip, r_hip = lmList[23], lmList[24]
            l_knee, r_knee = lmList[25], lmList[26]
            l_ankle, r_ankle = lmList[27], lmList[28]

            active_angle = 0

            if req_joint == "elbow":
                l_arm = calculate_angle(l_shoulder[1:], l_elbow[1:], l_wrist[1:])
                r_arm = calculate_angle(r_shoulder[1:], r_elbow[1:], r_wrist[1:])
                active_angle = min(l_arm, r_arm) 

            elif req_joint == "knee":
                l_leg = calculate_angle(l_hip[1:], l_knee[1:], l_ankle[1:])
                r_leg = calculate_angle(r_hip[1:], r_knee[1:], r_ankle[1:])
                active_angle = min(l_leg, r_leg)
                
            elif req_joint == "hip":
                l_hinge = calculate_angle(l_shoulder[1:], l_hip[1:], l_knee[1:])
                r_hinge = calculate_angle(r_shoulder[1:], r_hip[1:], r_knee[1:])
                active_angle = min(l_hinge, r_hinge)

            elif req_joint == "shoulder":
                l_raise = calculate_angle(l_hip[1:], l_shoulder[1:], l_elbow[1:])
                r_raise = calculate_angle(r_hip[1:], r_shoulder[1:], r_elbow[1:])
                active_angle = max(l_raise, r_raise) 
                
            elif req_joint == "wrist":
                active_angle = calculate_angle(l_elbow[1:], l_wrist[1:], lmList[17][1:]) 

            # ── Exercise Verification Gate ───────────────────────
            is_verified, verify_msg = verifier.verify(current_exercise, lmList)

            if not is_verified:
                # Wrong exercise — show banner, lock reps, skip scoring
                warning_msg = injury_detector.check_form(current_exercise, lmList)
                clean_name = current_exercise.replace("_", " ")
                frame = draw_dashboard(frame, clean_name, profiler.count, profiler.stage,
                                       0, "Do correct exercise!", 0, warning_msg, verify_msg)
            else:
                # ── Correct exercise confirmed — count reps & score ─
                reps, stage = profiler.update_reps(active_angle, stats["up"], stats["down"])
                score = int(100 - (abs(stats["ideal"] - active_angle) * 1.5))
                score = max(0, min(100, score))

                progress_range = abs(stats["up"] - stats["down"])
                progress = int(abs(active_angle - stats["up"]) / progress_range * 100) if progress_range != 0 else 0
                progress = max(0, min(100, progress))

                if score > 85: tip = "Perfect!"
                elif active_angle > stats["up"]: tip = "Extend fully"
                elif active_angle < stats["down"]: tip = "Good depth"
                else: tip = "Keep going"

                warning_msg = injury_detector.check_form(current_exercise, lmList)
                clean_name = current_exercise.replace("_", " ")
                frame = draw_dashboard(frame, clean_name, reps, stage, score, tip, progress, warning_msg, "")

        cv2.putText(frame, "Press 'M' to change exercise", (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        if key == ord('m') or key == ord('M'): 
            app_state = "MENU_CATEGORY"

    cv2.imshow(WINDOW_NAME, frame)
    if key == 27: break # ESC key to exit

cap.release()
if demo_cap is not None:
    demo_cap.release()
cv2.destroyAllWindows()