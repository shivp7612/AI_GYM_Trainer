# exercises/exercise_dict.py

WORKOUT_PLAN = {
    # -------------------------------------
    # 1. CHEST
    # -------------------------------------
    "Chest": {
        "barbell_bench_press": {
            "joint": "elbow", "posture": "floor", 
            "up": 160, "down": 90, "ideal": 90
        },
        "incline_dumbbell_press": {
            "joint": "elbow", "posture": "seated", 
            "up": 160, "down": 90, "ideal": 90
        },
        "cable_fly_pec_deck": {
            "joint": "shoulder", "posture": "standing", 
            "up": 90, "down": 20, "ideal": 90  # Tracking arm angle relative to torso
        }
    },

    # -------------------------------------
    # 2. BACK
    # -------------------------------------
    "Back": {
        "barbell_row": {
            "joint": "elbow", "posture": "bent_over",
            "up": 160, "down": 70, "ideal": 70
        },
        "seated_cable_row": {
            "joint": "elbow", "posture": "seated",
            "up": 160, "down": 70, "ideal": 70
        },
        "pullup_chinup": {
            "joint": "elbow", "posture": "hanging",
            "up": 160, "down": 50, "ideal": 50
        },
        "lat_pulldown": {
            "joint": "elbow", "posture": "seated",
            "up": 160, "down": 60, "ideal": 60
        },
        "straight_arm_pulldown": {
            "joint": "shoulder", "posture": "standing",
            "up": 150, "down": 20, "ideal": 20
        }
    },

    # -------------------------------------
    # 3. SHOULDERS (DELTS)
    # -------------------------------------
    "Shoulders": {
        "overhead_press": {
            "joint": "elbow", "posture": "standing",
            "up": 160, "down": 70, "ideal": 160 # Push mechanic
        },
        "lateral_raise": {
            "joint": "shoulder", "posture": "standing",
            "up": 90, "down": 15, "ideal": 90
        },
        "front_raise": {
            "joint": "shoulder", "posture": "standing",
            "up": 90, "down": 10, "ideal": 90
        },
        "upright_row": {
            "joint": "elbow", "posture": "standing",
            "up": 160, "down": 70, "ideal": 70
        },
        "face_pull": {
            "joint": "elbow", "posture": "standing",
            "up": 150, "down": 60, "ideal": 60
        }
    },

    # -------------------------------------
    # 4. ARMS
    # -------------------------------------
    "Arms": {
        "bicep_curl": {
            "joint": "elbow", "posture": "standing",
            "up": 140, "down": 50, "ideal": 50
        },
        "tricep_pushdown": {
            "joint": "elbow", "posture": "standing",
            "up": 70, "down": 160, "ideal": 160 # Push mechanic: bent is start, straight is flexed
        },
        "overhead_tricep_extension": {
            "joint": "elbow", "posture": "standing",
            "up": 160, "down": 70, "ideal": 160 
        },
        "dips": {
            "joint": "elbow", "posture": "hanging",
            "up": 160, "down": 90, "ideal": 90
        }
    },

    # -------------------------------------
    # 5. CORE (ABS)
    # -------------------------------------
    "Core": {
        "crunches": {
            "joint": "hip", "posture": "floor",
            "up": 150, "down": 110, "ideal": 110 # Torso bending toward legs
        },
        "leg_raises": {
            "joint": "hip", "posture": "floor",
            "up": 170, "down": 90, "ideal": 90 # Legs raising toward torso
        },
        "russian_twist": {
            "joint": "shoulder", "posture": "floor",
            "up": 120, "down": 60, "ideal": 60 # Tracking torso rotation via shoulders
        }
    },

    # -------------------------------------
    # 6. LEGS
    # -------------------------------------
    "Legs": {
        "squat": {
            "joint": "knee", "posture": "standing",
            "up": 160, "down": 100, "ideal": 90
        },
        "leg_press": {
            "joint": "knee", "posture": "seated",
            "up": 160, "down": 90, "ideal": 90
        },
        "leg_extension": {
            "joint": "knee", "posture": "seated",
            "up": 90, "down": 170, "ideal": 170 # Push mechanic
        },
        "romanian_deadlift": {
            "joint": "hip", "posture": "standing",
            "up": 170, "down": 100, "ideal": 100 # Hinge mechanic
        },
        "leg_curl": {
            "joint": "knee", "posture": "floor",
            "up": 170, "down": 90, "ideal": 90 # Pull mechanic
        },
        "hip_thrust": {
            "joint": "hip", "posture": "floor",
            "up": 110, "down": 170, "ideal": 170 # Push mechanic
        },
        "calf_raise": {
            "joint": "ankle", "posture": "standing",
            "up": 90, "down": 130, "ideal": 130 # Ankle extension (plantarflexion)
        }
    },

    # -------------------------------------
    # 7. TRAPS & 8. FOREARMS
    # -------------------------------------
    "Traps_Forearms": {
        "shrugs": {
            "joint": "shoulder", "posture": "standing",
            "up": 100, "down": 70, "ideal": 70 # Shrug angle relative to neck
        },
        "wrist_curl": {
            "joint": "wrist", "posture": "seated",
            "up": 170, "down": 120, "ideal": 120
        }
    }
}

# Helper list to flatten the dictionary for easy searching in the main loop
ALL_EXERCISES = {}
for category, exercises in WORKOUT_PLAN.items():
    for ex_name, ex_data in exercises.items():
        ALL_EXERCISES[ex_name] = ex_data