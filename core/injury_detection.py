# core/injury_detection.py
from utils.angles import calculate_angle

class InjuryDetector:
    def __init__(self):
        # Group exercises by mechanics so we can reuse injury logic
        self.squat_mechanics = ["squat", "leg_press", "bulgarian_split_squat"]
        self.hinge_mechanics = ["romanian_deadlift", "good_mornings", "barbell_row"]
        self.push_mechanics = ["pushup", "barbell_bench_press", "incline_dumbbell_press"]
        self.pull_mechanics = ["bicep_curl", "lateral_raise", "upright_row"]

    def check_form(self, exercise, lmList):
        warning = ""
        if len(lmList) < 28: return warning

        # Extract useful points
        l_shoulder, r_shoulder = lmList[11][1:3], lmList[12][1:3]
        l_hip, r_hip = lmList[23][1:3], lmList[24][1:3]
        l_knee, r_knee = lmList[25][1:3], lmList[26][1:3]
        l_ankle, r_ankle = lmList[27][1:3], lmList[28][1:3]

        # 1. SQUAT MECHANICS: Check for Knee Cave
        if exercise in self.squat_mechanics:
            knee_dist = abs(l_knee[0] - r_knee[0])
            ankle_dist = abs(l_ankle[0] - r_ankle[0])
            if knee_dist < (ankle_dist * 0.6):
                warning = "RISK: Knees caving inward!"

        # 2. HINGE MECHANICS: Check for Rounding Lower Back
        elif exercise in self.hinge_mechanics:
            back_angle = calculate_angle(l_shoulder, l_hip, l_knee)
            if back_angle < 130: # If the back rounds heavily during a deadlift
                warning = "RISK: Keep back straight, hinge at hips!"

        # 3. STANDING PULLS: Check for Back Arching (Cheating)
        elif exercise in self.pull_mechanics:
            posture_angle = calculate_angle(r_shoulder, r_hip, r_knee)
            if posture_angle < 165:
                warning = "RISK: Stop arching your back!"

        return warning