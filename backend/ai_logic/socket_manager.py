# backend/ai_logic/socket_manager.py
import base64
import cv2
import numpy as np
import time
import math
from typing import Dict, Any, Tuple
from core.pose_detector import PoseDetector
from core.injury_detection import InjuryDetector
from core.exercise_verifier import ExerciseVerifier
from exercises.motion_profiler import MotionProfiler
from exercises.exercise_dict import ALL_EXERCISES
from backend.ai_logic.fatigue import FatigueTracker
from utils.angles import calculate_angle

class WorkoutSocketSession:
    def __init__(self):
        self.pose_detector = PoseDetector()
        self.injury_detector = InjuryDetector()
        self.exercise_verifier = ExerciseVerifier()
        self.motion_profiler = MotionProfiler()
        self.fatigue_tracker = FatigueTracker()
        
        self.current_exercise = ""
        self.start_time = time.time()
        self.reps_count = 0
        self.sets_count = 1
        self.stage = "-"
        
        # Scoring lists to average at end of workout
        self.accuracies = []
        self.fatigues = []
        self.risk_counts = {"Low": 0, "Medium": 0, "High": 0}
        
        # Water reminder trackers
        self.last_water_reminder = time.time()
        
        # Calibration baseline references
        self.prev_active_angle = 0
        self.rep_speed_history = []
        
    def set_exercise(self, exercise_name: str):
        if exercise_name != self.current_exercise:
            self.current_exercise = exercise_name
            self.motion_profiler.count = 0
            self.motion_profiler.stage = "-"
            self.exercise_verifier.reset()
            self.fatigue_tracker.reset()
            self.reps_count = 0
            self.stage = "-"
            self.sets_count = 1
            self.accuracies = []
            
    def process_frame(self, image_b64: str) -> Dict[str, Any]:
        """
        Decodes base64 frame, runs pose analysis, and returns metrics.
        """
        if not self.current_exercise:
            return {"error": "No exercise selected"}

        # 1. Decode base64 image
        try:
            if "," in image_b64:
                image_b64 = image_b64.split(",")[1]
            img_bytes = base64.b64decode(image_b64)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"error": "Failed to decode frame"}
        except Exception as e:
            return {"error": f"Base64 decode exception: {str(e)}"}

        h, w, _ = img.shape

        # 2. Run Pose Detection (Headless mode - don't draw on backend image)
        img = self.pose_detector.findPose(img, draw=False)
        lmList = self.pose_detector.getLandmarks(img)

        if len(lmList) < 29:
            return {
                "verified": False,
                "landmarks": [],
                "message": "Stand fully in the camera's view (entire body visible)",
                "reps": self.reps_count,
                "sets": self.sets_count,
                "stage": self.stage,
                "active_angle": 0,
                "form_accuracy": 0,
                "fatigue": 0,
                "stresses": {"lumbar": "Low", "knee": "Low", "shoulder": "Low", "neck": "Low"},
                "risk_score": "Low",
                "warning": "",
                "water_reminder": False
            }

        # 3. Format landmarks to return to React for high-performance canvas overlays
        react_landmarks = []
        for lm in lmList:
            # Scale coordinates back to percentages for screen-independent drawing
            react_landmarks.append({
                "id": lm[0],
                "x": round(lm[1] / w * 100, 1),
                "y": round(lm[2] / h * 100, 1),
                "z": round(lm[3], 2)
            })

        # 4. Check exercise configuration
        if self.current_exercise not in ALL_EXERCISES:
            return {"error": f"Exercise {self.current_exercise} not recognized in definitions"}

        stats = ALL_EXERCISES[self.current_exercise]
        req_joint = stats["joint"]

        # Map landmarks
        l_shoulder, r_shoulder = lmList[11], lmList[12]
        l_elbow, r_elbow = lmList[13], lmList[14]
        l_wrist, r_wrist = lmList[15], lmList[16]
        l_hip, r_hip = lmList[23], lmList[24]
        l_knee, r_knee = lmList[25], lmList[26]
        l_ankle, r_ankle = lmList[27], lmList[28]

        # Calculate active joint angle
        active_angle = 0
        active_joint_idx = 11  # default to shoulder

        if req_joint == "elbow":
            l_arm = calculate_angle(l_shoulder[1:3], l_elbow[1:3], l_wrist[1:3])
            r_arm = calculate_angle(r_shoulder[1:3], r_elbow[1:3], r_wrist[1:3])
            active_angle = min(l_arm, r_arm)
            active_joint_idx = 13 if l_arm < r_arm else 14

        elif req_joint == "knee":
            l_leg = calculate_angle(l_hip[1:3], l_knee[1:3], l_ankle[1:3])
            r_leg = calculate_angle(r_hip[1:3], r_knee[1:3], r_ankle[1:3])
            active_angle = min(l_leg, r_leg)
            active_joint_idx = 25 if l_leg < r_leg else 26
            
        elif req_joint == "hip":
            l_hinge = calculate_angle(l_shoulder[1:3], l_hip[1:3], l_knee[1:3])
            r_hinge = calculate_angle(r_shoulder[1:3], r_hip[1:3], r_knee[1:3])
            active_angle = min(l_hinge, r_hinge)
            active_joint_idx = 23 if l_hinge < r_hinge else 24

        elif req_joint == "shoulder":
            l_raise = calculate_angle(l_hip[1:3], l_shoulder[1:3], l_elbow[1:3])
            r_raise = calculate_angle(r_hip[1:3], r_shoulder[1:3], r_elbow[1:3])
            active_angle = max(l_raise, r_raise)
            active_joint_idx = 11 if l_raise > r_raise else 12
            
        elif req_joint == "wrist":
            # Just look at left wrist
            active_angle = calculate_angle(l_elbow[1:3], l_wrist[1:3], lmList[17][1:3])
            active_joint_idx = 15

        # 5. Verify correct muscle category active
        is_verified, verify_msg = self.exercise_verifier.verify(self.current_exercise, lmList)

        if not is_verified:
            return {
                "verified": False,
                "landmarks": react_landmarks,
                "message": verify_msg if verify_msg else "Incorrect exercise movement detected!",
                "reps": self.reps_count,
                "sets": self.sets_count,
                "stage": self.stage,
                "active_angle": int(active_angle),
                "form_accuracy": 0,
                "fatigue": 0,
                "stresses": {"lumbar": "Low", "knee": "Low", "shoulder": "Low", "neck": "Low"},
                "risk_score": "Low",
                "warning": "Wrong exercise form",
                "water_reminder": False
            }

        # 6. Rep counter
        prev_reps = self.reps_count
        reps, stage = self.motion_profiler.update_reps(active_angle, stats["up"], stats["down"])
        
        # Track rep time for fatigue
        if stage == "UP" and self.stage == "DOWN":
            self.fatigue_tracker.record_rep_start()
        
        if reps > prev_reps:
            # Completed a rep
            flex_peak = stats["down"] # approximation
            ext_peak = stats["up"]
            self.fatigue_tracker.record_rep_end(flex_peak, ext_peak)
            self.reps_count = reps
            
            # Increment sets if reps reach 12
            if self.reps_count > 0 and self.reps_count % 12 == 0:
                self.sets_count += 1
                
        self.stage = stage

        # 7. Form Accuracy Score
        score = int(100 - (abs(stats["ideal"] - active_angle) * 1.5))
        score = max(0, min(100, score))
        self.accuracies.append(score)

        # 8. Injury Warning Banner
        warning_msg = self.injury_detector.check_form(self.current_exercise, lmList)

        # 9. Stage 7: Detailed Joint Stress / Risk Prediction
        stresses = self.predict_joint_stresses(lmList)
        
        # Compute combined risk level
        risk_level = "Low"
        if "High" in stresses.values():
            risk_level = "High"
        elif "Medium" in stresses.values():
            risk_level = "Medium"
            
        self.risk_counts[risk_level] += 1

        # 10. Stage 8: Fatigue Tracker
        fatigue_val, fatigue_recom = self.fatigue_tracker.update_frame_data(lmList, active_joint_idx)
        self.fatigues.append(fatigue_val)

        # Compile final advice/warning override
        advice = fatigue_recom
        if warning_msg:
            advice = warning_msg
        elif risk_level == "High":
            # Select specific joint load warning
            for joint, stress in stresses.items():
                if stress == "High":
                    if joint == "shoulder":
                        advice = "WARNING: High Shoulder Load! Reduce weight or tuck elbows lower."
                    elif joint == "lumbar":
                        advice = "WARNING: High Lumbar Stress! Flatten your back and brace core."
                    elif joint == "knee":
                        advice = "WARNING: Knee Stress High! Avoid caving or pushing knees too far forward."
                    elif joint == "neck":
                        advice = "WARNING: Neck Stress High! Keep head neutral, don't look up/down."
                    break

        # 11. Stage 11: Water intake reminder (Every 3 minutes / 180 seconds during training)
        water_remind = False
        now = time.time()
        if now - self.last_water_reminder >= 180: # 3 mins
            water_remind = True
            self.last_water_reminder = now

        return {
            "verified": True,
            "landmarks": react_landmarks,
            "message": "Exercise form verified",
            "reps": self.reps_count,
            "sets": self.sets_count,
            "stage": self.stage,
            "active_angle": int(active_angle),
            "form_accuracy": score,
            "fatigue": int(fatigue_val),
            "stresses": stresses,
            "risk_score": risk_level,
            "warning": advice,
            "water_reminder": water_remind
        }

    def predict_joint_stresses(self, lmList: list) -> Dict[str, str]:
        """
        Calculates stress index (Low/Medium/High) across multiple joints.
        """
        stresses = {"lumbar": "Low", "knee": "Low", "shoulder": "Low", "neck": "Low"}
        if len(lmList) < 29:
            return stresses

        # Extract landmarks
        l_shoulder = lmList[11][1:3]
        r_shoulder = lmList[12][1:3]
        l_hip = lmList[23][1:3]
        r_hip = lmList[24][1:3]
        l_knee = lmList[25][1:3]
        r_knee = lmList[26][1:3]
        l_ankle = lmList[27][1:3]
        r_ankle = lmList[28][1:3]
        l_ear = lmList[7][1:3] # Ear for neck stress
        r_ear = lmList[8][1:3]
        l_elbow = lmList[13][1:3]
        r_elbow = lmList[14][1:3]
        l_wrist = lmList[15][1:3]
        r_wrist = lmList[16][1:3]

        # A. Lumbar Stress
        # High spine hinge or spinal flexion
        avg_hip = ((l_hip[0]+r_hip[0])/2, (l_hip[1]+r_hip[1])/2)
        avg_sh = ((l_shoulder[0]+r_shoulder[0])/2, (l_shoulder[1]+r_shoulder[1])/2)
        avg_kn = ((l_knee[0]+r_knee[0])/2, (l_knee[1]+r_knee[1])/2)
        
        back_angle = calculate_angle(avg_sh, avg_hip, avg_kn)
        
        if self.current_exercise in ["barbell_row", "romanian_deadlift"]:
            if back_angle < 125:
                stresses["lumbar"] = "High"
            elif back_angle < 140:
                stresses["lumbar"] = "Medium"
        elif self.current_exercise in ["squat", "leg_press"]:
            # Torso leaning too far forward under load puts shearing force on lumbar
            if back_angle < 110:
                stresses["lumbar"] = "High"
            elif back_angle < 130:
                stresses["lumbar"] = "Medium"

        # B. Knee Stress
        l_knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
        r_knee_angle = calculate_angle(r_hip, r_knee, r_ankle)
        min_knee = min(l_knee_angle, r_knee_angle)

        if self.current_exercise in ["squat", "leg_press", "leg_extension"]:
            # Deep knees past 80 deg or buckling knees
            knee_dist = abs(l_knee[0] - r_knee[0])
            ankle_dist = abs(l_ankle[0] - r_ankle[0])
            
            if knee_dist < (ankle_dist * 0.55):
                stresses["knee"] = "High" # Knees caving
            elif min_knee < 80.0:
                stresses["knee"] = "High" # Too deep, high compression
            elif min_knee < 100.0:
                stresses["knee"] = "Medium"

        # C. Shoulder Stress
        l_sh_angle = calculate_angle(l_hip, l_shoulder, l_elbow)
        r_sh_angle = calculate_angle(r_hip, r_shoulder, r_elbow)
        max_shoulder_abduction = max(l_sh_angle, r_sh_angle)

        if self.current_exercise in ["barbell_bench_press", "incline_dumbbell_press"]:
            # Elbow flaring > 80 degrees relative to torso
            if max_shoulder_abduction > 80.0:
                stresses["shoulder"] = "High"
            elif max_shoulder_abduction > 65.0:
                stresses["shoulder"] = "Medium"
        elif self.current_exercise in ["overhead_press", "lateral_raise"]:
            # Unstable or hyper-extended shoulders
            if max_shoulder_abduction > 110.0:
                stresses["shoulder"] = "High"
            elif max_shoulder_abduction > 95.0:
                stresses["shoulder"] = "Medium"

        # D. Neck Stress
        # Position of head relative to shoulders
        avg_ear_y = (l_ear[1] + r_ear[1]) / 2
        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        
        # Draw dynamic vertical vector
        # Head jutting forward increases distance
        ear_sh_horiz = abs(((l_ear[0]+r_ear[0])/2) - ((l_shoulder[0]+r_shoulder[0])/2))
        
        if ear_sh_horiz > 35: # Cranial tilt forward
            stresses["neck"] = "High"
        elif ear_sh_horiz > 20:
            stresses["neck"] = "Medium"

        return stresses
        
    def get_summary_metrics(self) -> Dict[str, Any]:
        """
        Returns average metrics for report/database logging.
        """
        avg_acc = int(np.mean(self.accuracies)) if self.accuracies else 85
        avg_fatigue = int(np.mean(self.fatigues)) if self.fatigues else 30
        
        # Calculate dominant risk score
        risk_level = "Low"
        if self.risk_counts["High"] > 20:
            risk_level = "High"
        elif self.risk_counts["Medium"] > 40:
            risk_level = "Medium"
            
        duration = round((time.time() - self.start_time) / 60.0, 1) # in minutes
        
        # Estimate calories burned based on duration and exercise category
        # ~6-8 kcal per min for weightlifting
        calories = round(duration * 7.5, 1)
        
        return {
            "duration": duration,
            "calories_burned": calories,
            "avg_accuracy": avg_acc,
            "avg_fatigue": avg_fatigue,
            "risk_level": risk_level
        }
