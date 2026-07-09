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
    "bicep_curl":               "Arms",
    "tricep_pushdown":          "Arms",
    "overhead_tricep_extension":"Arms",
    "dips":                     "Arms",
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
    "shrugs":                   "Traps_Forearms",
    "wrist_curl":               "Traps_Forearms",
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
        if category == "Arms":
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

        if category == "Traps_Forearms":
            return self._check_traps_forearms(avg_abduction, avg_elbow, exercise)

        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: ARMS  (Bicep Curl, Tricep Pushdown, etc.)
    # Signature: Standing upright + upper arm pinned to side
    # Discriminator: arm_abduction SMALL (arm at side, NOT raised)
    # Fails if: arms raised sideways (Shoulder), arms in front (Chest),
    #           legs being used (Legs), body tilted (Core)
    # ──────────────────────────────────────────────────────────────
    def _check_arms(self, avg_abduction, avg_torso,
                    l_wrist_low, r_wrist_low, exercise):

        # Must be standing upright
        if avg_torso < 140:
            return False, f"Stand upright for {exercise.replace('_',' ').title()}"

        # Core discriminator: upper arm must be mostly vertical (at side)
        # Abduction < 45° means arm is alongside body — this is the ARMS signature
        if exercise == "overhead_tricep_extension":
            # Special case: arm is OVERHEAD — wrists above head
            # We check this in shoulders actually, but for tricep extension,
            # the elbows are bent overhead — check elbow is high
            return True, ""

        if avg_abduction > 60:
            return (False,
                    "WRONG! Arms raised = Shoulder exercise. "
                    f"For {exercise.replace('_',' ').title()}: keep upper arm at your side")

        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: CHEST  (Bench Press, Incline Press, Cable Fly)
    # Signature: Arms extended/abducted outward OR body reclined
    # Discriminator: arm_abduction LARGE or body horizontal
    # CRITICAL: If arm_abduction is small (arm at side) → it's an ARMS exercise!
    # ──────────────────────────────────────────────────────────────
    def _check_chest(self, avg_abduction, avg_torso,
                     l_wrist_low, r_wrist_low, exercise):

        # ── Bench Press / Incline Press: body should be reclined
        if exercise in ("barbell_bench_press", "incline_dumbbell_press"):
            # When lying/reclined, torso angle collapses (landmarks nearly co-linear
            # at a lower angle as seen from front camera, or body appears foreshortened)
            # Also: arms should be abducted (flared out) for pressing
            if avg_abduction < 40:
                return (False,
                        "WRONG EXERCISE! You are doing an ARMS movement. "
                        "For Bench/Incline Press: lie on bench and press bar/dumbbells upward")
            return True, ""

        # ── Cable Fly / Pec Deck: arms spread wide then brought together
        if exercise == "cable_fly_pec_deck":
            if avg_abduction < 40:
                return (False,
                        "WRONG EXERCISE! Arms are at your sides — that's a Bicep Curl. "
                        "For Cable Fly: spread arms wide to the sides at shoulder height")
            return True, ""

        # Generic chest fallback
        if avg_abduction < 40:
            return (False,
                    "WRONG EXERCISE! Keep arms extended outward, not at your sides")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: SHOULDERS  (Lateral Raise, Front Raise, OHP, etc.)
    # Signature: Arms raised — elbow or wrist at/above shoulder level
    # ──────────────────────────────────────────────────────────────
    def _check_shoulders(self, avg_abduction,
                          l_elbow_up, r_elbow_up,
                          l_wrist_up, r_wrist_up, exercise):

        elbow_raised   = l_elbow_up or r_elbow_up
        wrist_raised   = l_wrist_up or r_wrist_up

        if exercise == "overhead_press":
            if not (wrist_raised or avg_abduction > 60):
                return (False,
                        "WRONG EXERCISE! Raise bar/dumbbells to at least shoulder level "
                        "for Overhead Press")
            return True, ""

        if exercise in ("lateral_raise", "front_raise"):
            if avg_abduction < 25 and not elbow_raised:
                return (False,
                        f"WRONG EXERCISE! Arms are at your sides. "
                        f"Raise arms outward/forward for {exercise.replace('_',' ').title()}")
            return True, ""

        if exercise in ("upright_row", "face_pull"):
            if not elbow_raised and avg_abduction < 30:
                return (False,
                        f"WRONG EXERCISE! Pull elbows up high for "
                        f"{exercise.replace('_',' ').title()}")
            return True, ""

        # Generic shoulder fallback
        if avg_abduction < 25 and not elbow_raised:
            return (False, "Raise your arms for this shoulder exercise")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: BACK  (Rows, Pulldowns, Pull-ups)
    # Signature: Torso hinged forward OR arms pulling from overhead
    # ──────────────────────────────────────────────────────────────
    def _check_back(self, avg_torso, avg_elbow,
                    l_wrist_up, r_wrist_up, exercise):

        # Pull-ups / Lat Pulldown: wrists must start above head
        if exercise in ("pullup_chinup", "lat_pulldown"):
            if not (l_wrist_up or r_wrist_up):
                return (False,
                        "WRONG EXERCISE! Reach arms overhead and grab the bar "
                        f"for {exercise.replace('_',' ').title()}")
            return True, ""

        # Rows / Romanian DL: torso should be hinged forward
        if exercise in ("barbell_row", "seated_cable_row", "straight_arm_pulldown"):
            if avg_torso > 160:
                return (False,
                        "WRONG EXERCISE! Hinge forward or sit upright at machine "
                        f"for {exercise.replace('_',' ').title()}")
            return True, ""

        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: LEGS  (Squat, Leg Press, Lunges, etc.)
    # Signature: Knees bent OR hip hinge active
    # Discriminator: knee angle must be below 155° at some point
    # Fails if: person stands fully straight doing an arm exercise
    # ──────────────────────────────────────────────────────────────
    def _check_legs(self, avg_knee, avg_torso, exercise):

        if exercise in ("romanian_deadlift",):
            if avg_torso > 160:
                return (False,
                        "WRONG EXERCISE! Hinge at hips (lean forward) "
                        "for Romanian Deadlift")
            return True, ""

        if exercise == "hip_thrust":
            if avg_torso > 150:
                return (False,
                        "WRONG EXERCISE! Position with back on bench and hips low "
                        "for Hip Thrust")
            return True, ""

        # For all squat/knee-dominant exercises: knees must show some bend
        if avg_knee > 168:
            return (False,
                    "WRONG EXERCISE! You are standing straight — "
                    f"bend your knees for {exercise.replace('_',' ').title()}")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: CORE  (Crunches, Leg Raises, Russian Twist)
    # Signature: Body tilted / horizontal, not upright
    # ──────────────────────────────────────────────────────────────
    def _check_core(self, avg_torso, exercise):
        if avg_torso > 160:
            return (False,
                    "WRONG EXERCISE! Get into position: "
                    f"lie down or sit at an angle for {exercise.replace('_',' ').title()}")
        return True, ""

    # ──────────────────────────────────────────────────────────────
    # Category: TRAPS / FOREARMS  (Shrugs, Wrist Curl)
    # Signature: Arms mostly straight, standing, slight shoulder elevation
    # ──────────────────────────────────────────────────────────────
    def _check_traps_forearms(self, avg_abduction, avg_elbow, exercise):
        if exercise == "wrist_curl":
            # Forearms should be resting on thighs → elbows bent ~90°
            if avg_elbow > 130:
                return (False,
                        "WRONG EXERCISE! Sit with forearms on thighs, "
                        "wrists hanging over knees for Wrist Curl")
            return True, ""

        if exercise == "shrugs":
            if avg_abduction > 60:
                return (False,
                        "WRONG EXERCISE! Stand with arms straight at sides "
                        "and shrug shoulders upward")
            return True, ""

        return True, ""
