# core/exercise_verifier.py
"""
ExerciseVerifier v2: Category-first posture verification.
Checks the USER's MUSCLE GROUP posture before allowing rep counting.
Chest selected? You must perform a chest movement — not biceps, not legs.
"""
from utils.angles import calculate_angle


# Map every exercise name → its muscle group category
EXERCISE_CATEGORY_MAP = {
    "barbell_bench_press":      "Chest",
    "incline_dumbbell_press":   "Chest",
    "cable_fly_pec_deck":       "Chest",
    "barbell_row":              "Back",
    "seated_cable_row":         "Back",
    "pullup_chinup":            "Back",
    "lat_pulldown":             "Back",
    "straight_arm_pulldown":    "Back",
    "overhead_press":           "Shoulders",
    "lateral_raise":            "Shoulders",
    "front_raise":              "Shoulders",
    "upright_row":              "Shoulders",
    "face_pull":                "Shoulders",
    "bicep_curl":               "Arms_Forearms",
    "tricep_pushdown":          "Arms_Forearms",
    "overhead_tricep_extension":"Arms_Forearms",
    "dips":                     "Arms_Forearms",
    "crunches":                 "Core",
    "leg_raises":               "Core",
    "russian_twist":            "Core",
    "squat":                    "Legs",
    "leg_press":                "Legs",
    "leg_extension":            "Legs",
    "romanian_deadlift":        "Legs",
    "leg_curl":                 "Legs",
    "hip_thrust":               "Legs",
    "calf_raise":               "Legs",
    "shrugs":                   "Arms_Forearms",
    "wrist_curl":               "Arms_Forearms",
    "pushups":                  "Chest",
    "dumbbell_fly":             "Chest",
    "dumbbell_bench_press":     "Chest",
    "deadlift":                 "Back",
}


class ExerciseVerifier:
    CONFIRM_FRAMES = 25   # frames of correct posture required to verify
    DEGRADE_RATE   = 5    # frames deducted per wrong-posture frame

    def __init__(self):
        self._correct_frames = 0
        self.is_verified = False

    def reset(self):
        """Call whenever the user selects a new exercise."""
        self._correct_frames = 0
        self.is_verified = False

    # ──────────────────────────────────────────────────────────────
    def verify(self, exercise_name: str, lmList: list) -> tuple:
        """
        Returns (is_verified: bool, message: str)
        Gates rep counting — only True when correct muscle group is active.
        """
        if len(lmList) < 29:
            return False, "Stand fully in frame (all body visible)"

        correct, msg = self._category_check(exercise_name, lmList)

        if correct:
            self._correct_frames = min(self._correct_frames + 1,
                                       self.CONFIRM_FRAMES + 10)
            if self._correct_frames >= self.CONFIRM_FRAMES:
                self.is_verified = True
        else:
            self._correct_frames = max(0,
                                       self._correct_frames - self.DEGRADE_RATE)
            if self._correct_frames == 0:
                self.is_verified = False

        return self.is_verified, ("" if self.is_verified else msg)

    # ──────────────────────────────────────────────────────────────
    # Category-level dispatcher
    # ──────────────────────────────────────────────────────────────
    def _category_check(self, exercise: str, lm: list) -> tuple:
        category = EXERCISE_CATEGORY_MAP.get(exercise, "")
        if not category:
            return True, ""   # unknown exercise — allow

        # Extract landmarks
        pt = lambda i: (lm[i][1], lm[i][2])   # (x, y)
        ls, rs  = pt(11), pt(12)   # shoulders
        le, re  = pt(13), pt(14)   # elbows
        lw, rw  = pt(15), pt(16)   # wrists
        lh, rh  = pt(23), pt(24)   # hips
        lk, rk  = pt(25), pt(26)   # knees
        la, ra  = pt(27), pt(28)   # ankles

        # Pre-compute common angles
        l_arm_abduction = calculate_angle(lh, ls, le)   # hip→shoulder→elbow
        r_arm_abduction = calculate_angle(rh, rs, re)
        avg_abduction   = (l_arm_abduction + r_arm_abduction) / 2

        l_elbow_angle = calculate_angle(ls, le, lw)
        r_elbow_angle = calculate_angle(rs, re, rw)
        avg_elbow     = (l_elbow_angle + r_elbow_angle) / 2

        l_knee_angle  = calculate_angle(lh, lk, la)
        r_knee_angle  = calculate_angle(rh, rk, ra)
        avg_knee      = (l_knee_angle + r_knee_angle) / 2

        l_torso       = calculate_angle(ls, lh, lk)   # shoulder→hip→knee
        r_torso       = calculate_angle(rs, rh, rk)
        avg_torso     = (l_torso + r_torso) / 2

        # Wrist height relative to shoulder (positive = wrist BELOW shoulder in image)
        l_wrist_below_shoulder = lw[1] > ls[1]
        r_wrist_below_shoulder = rw[1] > rs[1]
        l_wrist_above_head     = lw[1] < ls[1] - 30   # rough pixels above head
        r_wrist_above_head     = rw[1] < rs[1] - 30

        # Elbow height relative to shoulder
        l_elbow_above_shoulder = le[1] < ls[1]
        r_elbow_above_shoulder = re[1] < rs[1]

        # ── DISPATCH ──────────────────────────────────────────────
        if category == "Arms_Forearms":
            if exercise in ("shrugs", "wrist_curl"):
                return self._check_traps_forearms(avg_abduction, avg_elbow, exercise)
            else:
                return self._check_arms(avg_abduction, avg_torso,
                                        l_wrist_below_shoulder, r_wrist_below_shoulder,
                                        exercise)

        if category == "Chest":
            return self._check_chest(avg_abduction, avg_torso,
                                     l_wrist_below_shoulder, r_wrist_below_shoulder,
                                     exercise)

        if category == "Shoulders":
            return self._check_shoulders(avg_abduction,
                                         l_elbow_above_shoulder, r_elbow_above_shoulder,
                                         l_wrist_above_head, r_wrist_above_head,
                                         exercise)

        if category == "Back":
            return self._check_back(avg_torso, avg_elbow,
                                    l_wrist_above_head, r_wrist_above_head,
                                    exercise)

        if category == "Legs":
            return self._check_legs(avg_knee, avg_torso, exercise)

        if category == "Core":
            return self._check_core(avg_torso, exercise)

        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: ARMS  (Bicep Curl, Tricep Pushdown, Overhead Tricep Extension)
    # ──────────────────────────────────────────────────────────────
    def _check_arms(self, avg_abduction, avg_torso,
                    l_wrist_low, r_wrist_low, exercise):

        # Must be standing upright
        if avg_torso < 135:
            return False, f"Stand upright for {exercise.replace('_',' ').title()}"

        if exercise == "overhead_tricep_extension":
            # Arm/wrists must be overhead above shoulders
            if l_wrist_low and r_wrist_low:
                return (False,
                        "WRONG EXERCISE! Raise dumbbells overhead behind your head for Overhead Tricep Extension")
            return True, ""

        if exercise == "tricep_pushdown":
            if avg_abduction > 50:
                return (False,
                        "WRONG EXERCISE! Arms flared outward. For Tricep Pushdown: keep upper arms pinned to ribs and push down")
            return True, ""

        if exercise == "bicep_curl":
            if avg_abduction > 50:
                return (False,
                        "WRONG EXERCISE! Arms raised/flared outward. For Bicep Curl: keep upper arms pinned to your sides and curl upward")
            return True, ""

        if avg_abduction > 55:
            return (False,
                    f"WRONG EXERCISE! For {exercise.replace('_',' ').title()}: keep upper arms pinned to your sides")

        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: CHEST  (Bench Press, Incline Press, Cable Fly, Pushups)
    # ──────────────────────────────────────────────────────────────
    def _check_chest(self, avg_abduction, avg_torso,
                     l_wrist_low, r_wrist_low, exercise):

        # ── Bench Press / Incline Press / Pushups
        if exercise in ("barbell_bench_press", "incline_dumbbell_press", "dumbbell_bench_press", "pushups"):
            if avg_abduction < 35:
                return (False,
                        f"WRONG EXERCISE! Arms are at your sides. For {exercise.replace('_',' ').title()}: flare elbows outward and press weights away from chest")

            # CRITICAL DISCRIMINATOR: If torso is upright AND wrists press overhead -> That's a Shoulder Press, NOT an Incline/Flat Bench Press!
            if (not l_wrist_low or not r_wrist_low) and avg_torso > 155:
                return (False,
                        f"WRONG EXERCISE! You are doing an Overhead Shoulder Press! For {exercise.replace('_',' ').title()}: recline your bench/torso at an angle and press forward over your chest")

            return True, ""

        # ── Cable Fly / Pec Deck
        if exercise == "cable_fly_pec_deck" or exercise == "dumbbell_fly":
            if avg_abduction < 35:
                return (False,
                        f"WRONG EXERCISE! Arms are at your sides. For {exercise.replace('_',' ').title()}: spread arms wide to the sides at chest level")
            return True, ""

        if avg_abduction < 35:
            return (False, f"WRONG EXERCISE! Keep arms extended outward for {exercise.replace('_',' ').title()}")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: SHOULDERS  (Overhead Press, Lateral Raise, Front Raise, OHP, etc.)
    # ──────────────────────────────────────────────────────────────
    def _check_shoulders(self, avg_abduction,
                          l_elbow_up, r_elbow_up,
                          l_wrist_up, r_wrist_up, exercise):

        elbow_raised = l_elbow_up or r_elbow_up
        wrist_raised = l_wrist_up or r_wrist_up

        if exercise == "overhead_press":
            if not (wrist_raised or avg_abduction > 55):
                return (False,
                        "WRONG EXERCISE! Position weights at shoulders and press overhead for Overhead Press")
            return True, ""

        if exercise in ("lateral_raise", "front_raise"):
            if avg_abduction < 30 and not elbow_raised:
                return (False,
                        f"WRONG EXERCISE! Arms are at your sides. Raise arms outward/forward to shoulder level for {exercise.replace('_',' ').title()}")
            return True, ""

        if exercise in ("upright_row", "face_pull"):
            if not elbow_raised and avg_abduction < 30:
                return (False,
                        f"WRONG EXERCISE! Pull elbows up high to shoulder height for {exercise.replace('_',' ').title()}")
            return True, ""

        if avg_abduction < 30 and not elbow_raised:
            return (False, f"Raise your arms for {exercise.replace('_',' ').title()}")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: BACK  (Rows, Pulldowns, Pull-ups)
    # ──────────────────────────────────────────────────────────────
    def _check_back(self, avg_torso, avg_elbow,
                    l_wrist_up, r_wrist_up, exercise):

        if exercise in ("pullup_chinup", "lat_pulldown"):
            if not (l_wrist_up or r_wrist_up):
                return (False,
                        f"WRONG EXERCISE! Reach arms overhead to grab the bar for {exercise.replace('_',' ').title()}")
            return True, ""

        if exercise in ("barbell_row", "seated_cable_row", "straight_arm_pulldown", "deadlift"):
            if avg_torso > 165 and exercise == "barbell_row":
                return (False,
                        "WRONG EXERCISE! Hinge forward at the hips for Barbell Row")
            return True, ""

        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: LEGS  (Squat, Leg Press, Lunges, Deadlift, etc.)
    # ──────────────────────────────────────────────────────────────
    def _check_legs(self, avg_knee, avg_torso, exercise):

        if exercise == "romanian_deadlift":
            if avg_torso > 165:
                return (False,
                        "WRONG EXERCISE! Hinge forward at hips with flat back for Romanian Deadlift")
            return True, ""

        if exercise == "hip_thrust":
            if avg_torso > 150:
                return (False,
                        "WRONG EXERCISE! Position back against bench with hips low for Hip Thrust")
            return True, ""

        if exercise == "squat":
            # The starting position for a squat is standing up (straight knees).
            # We shouldn't flag it as a wrong exercise just because they are standing.
            # But we can check if they are lying down or completely horizontal.
            if avg_torso < 100:
                return (False, "WRONG EXERCISE! Stand up to perform Squats")
            return True, ""
            
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: CORE  (Crunches, Leg Raises, Russian Twist)
    # ──────────────────────────────────────────────────────────────
    def _check_core(self, avg_torso, exercise):
        if avg_torso > 160:
            return (False,
                    f"WRONG EXERCISE! Get into position: lie down or sit at an angle for {exercise.replace('_',' ').title()}")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: TRAPS / FOREARMS  (Shrugs, Wrist Curl)
    # ──────────────────────────────────────────────────────────────
    def _check_traps_forearms(self, avg_abduction, avg_elbow, exercise):
        if exercise == "wrist_curl":
            if avg_elbow > 135:
                return (False,
                        "WRONG EXERCISE! Rest forearms on thighs with wrists over knees for Wrist Curl")
            return True, ""

        if exercise == "shrugs":
            if avg_abduction > 55:
                return (False,
                        "WRONG EXERCISE! Stand with arms straight at sides and shrug shoulders upward for Shrugs")
            return True, ""

        return True, ""
