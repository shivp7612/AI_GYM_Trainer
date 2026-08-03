# backend/ai_logic/planner.py
from typing import List, Dict, Any

def calculate_profile_metrics(age: int, gender: str, height: float, weight: float, goal: str, workout_days: int = 4) -> Dict[str, Any]:
    """
    Calculates BMI, BMR, Daily Calories, and macro targets.
    """
    # 1. BMI
    height_m = height / 100.0
    bmi = round(weight / (height_m ** 2), 1)

    # 2. Body Fat Estimate (Formula based on BMI, Age, Gender)
    # Gender factor: Male = 1, Female = 0
    gender_factor = 1 if gender.lower() == "male" else 0
    body_fat = round((1.20 * bmi) + (0.23 * age) - (10.8 * gender_factor) - 5.4, 1)
    body_fat = max(3.0, body_fat) # lower bound

    # 3. BMR (Mifflin-St Jeor Equation)
    if gender.lower() == "male":
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    
    # 4. TDEE based on workout_days
    if workout_days <= 2:
        activity_multiplier = 1.2
    elif workout_days == 3:
        activity_multiplier = 1.375
    elif workout_days <= 5:
        activity_multiplier = 1.55
    else:
        activity_multiplier = 1.725

    tdee = bmr * activity_multiplier

    # 5. Goal Adjustments
    if goal == "Weight Loss":
        target_calories = int(tdee - 500)
        protein_factor = 2.2 # higher protein to spare muscle in deficit
        target_weight = round(weight - (weight * 0.08), 1) # target 8% loss initially
        goal_time_weeks = 8
        sleep_hours = 8.0
    elif goal == "Muscle Gain":
        target_calories = int(tdee + 300)
        protein_factor = 2.0
        target_weight = round(weight + (weight * 0.05), 1) # target 5% muscle gain
        goal_time_weeks = 12
        sleep_hours = 8.5
    elif goal == "Strength":
        target_calories = int(tdee + 150)
        protein_factor = 1.8
        target_weight = round(weight + (weight * 0.03), 1)
        goal_time_weeks = 10
        sleep_hours = 8.0
    elif goal == "Rehabilitation":
        target_calories = int(tdee)
        protein_factor = 1.6
        target_weight = weight
        goal_time_weeks = 6
        sleep_hours = 9.0 # extra rest for recovery
    else: # General Fitness
        target_calories = int(tdee)
        protein_factor = 1.5
        target_weight = weight
        goal_time_weeks = 8
        sleep_hours = 7.5

    target_calories = max(1200, target_calories) # Safety lower bound
    
    # Target macros
    protein = int(weight * protein_factor)
    # Fat: 25% of calories
    fat = int((target_calories * 0.25) / 9)
    # Carbs: remainder
    carbs = int((target_calories - (protein * 4) - (fat * 9)) / 4)

    # Water intake: 35ml per kg of bodyweight, with minimum 2.5L and maximum 5L
    water = round(max(2.5, min(5.0, (weight * 0.035))), 1)

    return {
        "bmi": bmi,
        "body_fat_est": body_fat,
        "target_calories": target_calories,
        "target_protein": protein,
        "target_carbs": carbs,
        "target_fat": fat,
        "target_water": water,
        "sleep_hours": sleep_hours,
        "target_weight": target_weight,
        "goal_time_weeks": goal_time_weeks
    }


def generate_workout_plan(experience: str, goal: str, equipment: List[str], injuries: List[str], workout_days: int, gender: str = "Male", weight: float = 70.0) -> Dict[str, Any]:
    """
    Generates a structured weekly workout plan based on user profile.
    Swaps out unsafe exercises for injuries.
    """
    # Base exercises by muscle group and equipment availability
    is_home = "Home" in equipment or len(equipment) == 1 and "Bodyweight" in equipment
    is_gym = "Gym" in equipment
    has_dumbbells = "Dumbbells" in equipment or is_gym
    has_bands = "Resistance Bands" in equipment or "Resistance Band" in equipment
    is_female = gender.lower() == "female"

    # Construct treadmill recovery session based on weight and goal
    goal_lower = goal.lower()
    if weight > 85:
        if "loss" in goal_lower or "fat" in goal_lower:
            duration = "25 mins"
            speed = "4.8 km/h"
            incline = "5%"
            desc = "Incline Walk for fat loss & joint safety."
        elif "build" in goal_lower or "muscle" in goal_lower or "gain" in goal_lower:
            duration = "15 mins"
            speed = "4.2 km/h"
            incline = "2%"
            desc = "Active recovery walk to protect knee joints."
        else:
            duration = "20 mins"
            speed = "4.5 km/h"
            incline = "3%"
            desc = "Steady-state walk for heart health."
    else:
        if "loss" in goal_lower or "fat" in goal_lower:
            duration = "30 mins"
            speed = "5.5 km/h"
            incline = "6%"
            desc = "Incline walking fat burner."
        elif "build" in goal_lower or "muscle" in goal_lower or "gain" in goal_lower:
            duration = "12 mins"
            speed = "4.5 km/h"
            incline = "1.5%"
            desc = "Active recovery walk to complete steps."
        else:
            duration = "20 mins"
            speed = "7.5 km/h"
            incline = "2%"
            desc = "Cardio endurance jog."
            
    treadmill_session = ("treadmill", f"{duration} | Speed: {speed} | Incline: {incline} | {desc}")

    # Map categories to workouts
    chest_exercises = []
    back_exercises = []
    shoulder_exercises = []
    arm_exercises = []
    leg_exercises = []
    core_exercises = []

    # Populate exercises based on equipment
    if is_gym:
        if is_female:
            chest_exercises = [
                ("incline_dumbbell_press", "Incline Dumbbell Press"),
                ("dumbbell_fly", "Dumbbell Fly"),
                ("pushups", "Knee Pushups / Incline Pushups"),
                ("cable_fly_pec_deck", "Pec Deck Fly"),
                ("dumbbell_bench_press", "Dumbbell Bench Press"),
                ("barbell_bench_press", "Light Barbell Press")
            ]
            back_exercises = [
                ("lat_pulldown", "Lat Pulldown"),
                ("seated_cable_row", "Seated Cable Row"),
                ("straight_arm_pulldown", "Straight Arm Pulldown"),
                ("barbell_row", "Dumbbell Row"),
                ("deadlift", "Light Deadlift"),
                ("pullup_chinup", "Assisted Pull-up")
            ]
            shoulder_exercises = [
                ("lateral_raise", "Dumbbell Lateral Raise"),
                ("front_raise", "Dumbbell Front Raise"),
                ("overhead_press", "Dumbbell Shoulder Press")
            ]
            arm_exercises = [
                ("bicep_curl", "Dumbbell Bicep Curl"),
                ("tricep_pushdown", "Cable Tricep Pushdown"),
                ("overhead_tricep_extension", "Dumbbell Tricep Extension"),
                ("dips", "Bench Dips"),
                ("shrugs", "Dumbbell Shrugs"),
                ("wrist_curl", "Wrist Curl")
            ]
            leg_exercises = [
                ("squat", "Goblet Squat / Barbell Squat"),
                ("romanian_deadlift", "Dumbbell Romanian Deadlift"),
                ("leg_press", "Leg Press"),
                ("calf_raise", "Standing Calf Raise")
            ]
            core_exercises = [
                ("crunches", "Abdominal Crunches"),
                ("leg_raises", "Lying Leg Raises"),
                ("russian_twist", "Russian Twist")
            ]
        else:
            chest_exercises = [
                ("barbell_bench_press", "Barbell Bench Press"),
                ("incline_dumbbell_press", "Incline Dumbbell Press"),
                ("cable_fly_pec_deck", "Cable Fly / Pec Deck"),
                ("pushups", "Regular Pushup"),
                ("dumbbell_fly", "Dumbbell Fly"),
                ("dumbbell_bench_press", "Flat Dumbbell Press")
            ]
            back_exercises = [
                ("pullup_chinup", "Wide Grip Pull-up"),
                ("lat_pulldown", "Lat Pulldown"),
                ("barbell_row", "Bent-over Barbell Row"),
                ("deadlift", "Deadlift")
            ]
            shoulder_exercises = [
                ("overhead_press", "Barbell Overhead Press"),
                ("lateral_raise", "Dumbbell Lateral Raise"),
                ("front_raise", "Dumbbell Front Raise")
            ]
            arm_exercises = [
                ("bicep_curl", "Dumbbell Bicep Curl"),
                ("tricep_pushdown", "Cable Tricep Pushdown"),
                ("overhead_tricep_extension", "Dumbbell Overhead Tricep Extension"),
                ("dips", "Tricep Dips"),
                ("shrugs", "Dumbbell Shrugs"),
                ("wrist_curl", "Dumbbell Wrist Curl")
            ]
            leg_exercises = [
                ("squat", "Barbell Squat"),
                ("leg_press", "Leg Press"),
                ("romanian_deadlift", "Romanian Deadlift"),
                ("calf_raise", "Standing Calf Raise")
            ]
            core_exercises = [
                ("crunches", "Abdominal Crunches"),
                ("leg_raises", "Lying Leg Raises"),
                ("russian_twist", "Russian Twist")
            ]
    elif has_dumbbells:
        if is_female:
            chest_exercises = [("dumbbell_fly", "Dumbbell Chest Fly"), ("pushups", "Knee Pushups / Incline Pushups")]
            back_exercises = [("barbell_row", "Dumbbell Row"), ("pullup_chinup", "Doorframe Rows")]
            shoulder_exercises = [("overhead_press", "Dumbbell Shoulder Press"), ("lateral_raise", "Dumbbell Lateral Raise")]
            arm_exercises = [("bicep_curl", "Dumbbell Bicep Curl"), ("overhead_tricep_extension", "Dumbbell Tricep Extension")]
            leg_exercises = [("squat", "Goblet Squat"), ("romanian_deadlift", "Dumbbell Romanian Deadlift"), ("calf_raise", "Calf Raise")]
            core_exercises = [("crunches", "Abdominal Crunches"), ("leg_raises", "Lying Leg Raises")]
        else:
            chest_exercises = [("incline_dumbbell_press", "Dumbbell Bench Press"), ("pushups", "Regular Push-up")]
            back_exercises = [("barbell_row", "Dumbbell Row"), ("pullup_chinup", "Chin-up (if bar available)")]
            shoulder_exercises = [("overhead_press", "Dumbbell Overhead Press"), ("lateral_raise", "Dumbbell Lateral Raise")]
            arm_exercises = [("bicep_curl", "Dumbbell Bicep Curl"), ("overhead_tricep_extension", "Dumbbell Tricep Extension")]
            leg_exercises = [("squat", "Goblet Squat"), ("romanian_deadlift", "Dumbbell Romanian Deadlift"), ("calf_raise", "Dumbbell Calf Raise")]
            core_exercises = [("crunches", "Abdominal Crunches"), ("leg_raises", "Lying Leg Raises"), ("russian_twist", "Weighted Russian Twist")]
    else: # Bodyweight / bands
        if is_female:
            chest_exercises = [("pushups", "Knee Pushups / Incline Pushups")]
            back_exercises = [("pullup_chinup", "Assisted Doorframe Pull-up"), ("barbell_row", "Resistance Band Row" if has_bands else "Inverted Table Row")]
            shoulder_exercises = [("lateral_raise", "Resistance Band Lateral Raise" if has_bands else "Pike Pushups")]
            arm_exercises = [("bicep_curl", "Band Bicep Curl" if has_bands else "Doorframe Curls"), ("dips", "Bench Dips")]
            leg_exercises = [("squat", "Bodyweight Squat"), ("calf_raise", "Calf Raise")]
            core_exercises = [("crunches", "Crunches"), ("leg_raises", "Leg Raises")]
        else:
            chest_exercises = [("pushups", "Regular Push-up")]
            back_exercises = [("pullup_chinup", "Bodyweight Pull-up"), ("barbell_row", "Resistance Band Row" if has_bands else "Inverted Table Row")]
            shoulder_exercises = [("lateral_raise", "Resistance Band Lateral Raise" if has_bands else "Pike Pushups")]
            arm_exercises = [("bicep_curl", "Band Bicep Curl" if has_bands else "Doorframe Curls"), ("dips", "Bench Dips")]
            leg_exercises = [("squat", "Bodyweight Squat"), ("calf_raise", "Bodyweight Calf Raise")]
            core_exercises = [("crunches", "Crunches"), ("leg_raises", "Leg Raises")]

    # Apply Injury Safety Swaps (Critical Rule!)
    injury_swapped = []
    
    # 1. Shoulder Injury
    if "Shoulder" in injuries:
        # Swap overhead press or military presses
        for i, (key, name) in enumerate(shoulder_exercises):
            if key == "overhead_press":
                # Replace with lateral raise or front raise, which put less compression on the AC joint
                shoulder_exercises[i] = ("lateral_raise", "Safer Alternative: Light Lateral Raise")
                injury_swapped.append("Swapped Overhead Press for Light Lateral Raises (Shoulder Safety)")
            elif key == "cable_fly_pec_deck":
                chest_exercises[i] = ("pushup", "Safer Alternative: Incline Push-ups (reduces shoulder strain)")
                injury_swapped.append("Swapped Pec Deck for Incline Push-ups")

    # 2. Knee Injury
    if "Knee" in injuries:
        # Swap Squats/Leg Press with joint-friendly extensions or glute bridges
        for i, (key, name) in enumerate(leg_exercises):
            if key == "squat" or key == "leg_press":
                leg_exercises[i] = ("calf_raise", "Safer Alternative: Standing Calf Raise & Bodyweight Glute Bridge")
                injury_swapped.append(f"Swapped {name} for Calf Raise & Glute Bridge (Knee Safety)")

    # 3. Back Injury
    if "Back" in injuries:
        # Swap Deadlifts / heavy barbell rows
        for i, (key, name) in enumerate(leg_exercises):
            if key == "romanian_deadlift":
                leg_exercises[i] = ("calf_raise", "Safer Alternative: Bodyweight Glute Bridge (Back Friendly)")
                injury_swapped.append("Swapped Romanian Deadlift for Glute Bridge")
        for i, (key, name) in enumerate(back_exercises):
            if key == "barbell_row":
                back_exercises[i] = ("pullup_chinup", "Safer Alternative: Assisted Pull-ups or Chest-Supported Rows")
                injury_swapped.append("Swapped Barbell Row for Supported Rows")

    # Determine sets and reps based on experience
    if experience == "Beginner":
        sets = 3
        reps = 10
        desc = "Light weight. Focus strictly on form. 75s rest."
        timer = 75
    elif experience == "Advanced":
        sets = 5
        reps = 12
        desc = "Heavy weight. Drop sets on last sets. 120s rest."
        timer = 120
    else: # Intermediate
        sets = 4
        reps = 12
        desc = "Moderate weight. Aim for progressive overload. 90s rest."
        timer = 90

    # Define 6-exercise pools for different splits
    # 1. Base Push, Pull, Legs (3-day / fallback)
    push_exercises = chest_exercises[:3] + shoulder_exercises[:2] + [ex for ex in arm_exercises if ex[0] in ("tricep_pushdown", "overhead_tricep_extension", "dips")][:1]
    while len(push_exercises) < 6:
        for ex in chest_exercises + shoulder_exercises + arm_exercises:
            if ex not in push_exercises:
                push_exercises.append(ex)
                if len(push_exercises) == 6: break
                
    pull_exercises = back_exercises[:3] + [ex for ex in arm_exercises if ex[0] in ("bicep_curl", "wrist_curl")][:2] + [ex for ex in arm_exercises if ex[0] == "shrugs"][:1]
    while len(pull_exercises) < 6:
        for ex in back_exercises + arm_exercises:
            if ex not in pull_exercises:
                pull_exercises.append(ex)
                if len(pull_exercises) == 6: break
                
    legs_exercises = leg_exercises[:4] + core_exercises[:2]
    while len(legs_exercises) < 6:
        for ex in leg_exercises + core_exercises:
            if ex not in legs_exercises:
                legs_exercises.append(ex)
                if len(legs_exercises) == 6: break

    # 2. 6-Day Split (Push A/B, Pull A/B, Legs A/B)
    push_exercises_a = chest_exercises[:3] + shoulder_exercises[:2] + [ex for ex in arm_exercises if ex[0] in ("tricep_pushdown", "dips")][:1]
    while len(push_exercises_a) < 6:
        for ex in chest_exercises + shoulder_exercises + arm_exercises:
            if ex not in push_exercises_a:
                push_exercises_a.append(ex)
                if len(push_exercises_a) == 6: break

    push_exercises_b = chest_exercises[3:6] + shoulder_exercises[1:3] + [ex for ex in arm_exercises if ex[0] in ("overhead_tricep_extension", "dips")][:1]
    while len(push_exercises_b) < 6:
        for ex in chest_exercises + shoulder_exercises + arm_exercises:
            if ex not in push_exercises_b:
                push_exercises_b.append(ex)
                if len(push_exercises_b) == 6: break

    pull_exercises_a = back_exercises[:3] + [ex for ex in arm_exercises if ex[0] in ("bicep_curl", "wrist_curl")][:2] + [ex for ex in arm_exercises if ex[0] == "shrugs"][:1]
    while len(pull_exercises_a) < 6:
        for ex in back_exercises + arm_exercises:
            if ex not in pull_exercises_a:
                pull_exercises_a.append(ex)
                if len(pull_exercises_a) == 6: break

    pull_exercises_b = back_exercises[3:6] + [ex for ex in arm_exercises if ex[0] in ("bicep_curl", "wrist_curl")][1:3] + [ex for ex in arm_exercises if ex[0] == "shrugs"][:1]
    while len(pull_exercises_b) < 6:
        for ex in back_exercises + arm_exercises:
            if ex not in pull_exercises_b:
                pull_exercises_b.append(ex)
                if len(pull_exercises_b) == 6: break

    legs_exercises_a = leg_exercises[:3] + core_exercises[:3]
    while len(legs_exercises_a) < 6:
        for ex in leg_exercises + core_exercises:
            if ex not in legs_exercises_a:
                legs_exercises_a.append(ex)
                if len(legs_exercises_a) == 6: break

    legs_exercises_b = leg_exercises[1:4] + core_exercises[:3]
    while len(legs_exercises_b) < 6:
        for ex in leg_exercises + core_exercises:
            if ex not in legs_exercises_b:
                legs_exercises_b.append(ex)
                if len(legs_exercises_b) == 6: break

    # Build weekly schedule
    schedule = {}
    if workout_days == 2:
        schedule["Monday"] = {"name": "Full Body A", "exercises": (chest_exercises[:2] + back_exercises[:2] + leg_exercises[:2])[:6]}
        schedule["Tuesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Wednesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Thursday"] = {"name": "Full Body B", "exercises": (shoulder_exercises[:2] + arm_exercises[:2] + core_exercises[:2])[:6]}
        schedule["Friday"] = {"name": "Rest Day", "exercises": []}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    elif workout_days == 3:
        schedule["Monday"] = {"name": "Push Day", "exercises": push_exercises}
        schedule["Tuesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Wednesday"] = {"name": "Pull Day", "exercises": pull_exercises}
        schedule["Thursday"] = {"name": "Rest Day", "exercises": []}
        schedule["Friday"] = {"name": "Legs & Core", "exercises": legs_exercises}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    elif workout_days == 4:
        schedule["Monday"] = {"name": "Chest & Triceps", "exercises": (chest_exercises[:4] + [ex for ex in arm_exercises if ex[0] in ("tricep_pushdown", "overhead_tricep_extension", "dips")][:2])[:6]}
        schedule["Tuesday"] = {"name": "Back & Biceps", "exercises": (back_exercises[:4] + [ex for ex in arm_exercises if ex[0] in ("bicep_curl", "wrist_curl")][:2])[:6]}
        schedule["Wednesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Thursday"] = {"name": "Shoulders & Core", "exercises": (shoulder_exercises[:3] + core_exercises[:3])[:6]}
        schedule["Friday"] = {"name": "Legs", "exercises": legs_exercises}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    elif workout_days == 5:
        schedule["Monday"] = {"name": "Chest Workout", "exercises": chest_exercises[:6]}
        schedule["Tuesday"] = {"name": "Back Workout", "exercises": back_exercises[:6]}
        schedule["Wednesday"] = {"name": "Leg Workout", "exercises": legs_exercises}
        schedule["Thursday"] = {"name": "Shoulder Workout", "exercises": (shoulder_exercises[:3] + [ex for ex in arm_exercises if ex[0] == "shrugs"][:1] + core_exercises[:2])[:6]}
        schedule["Friday"] = {"name": "Arms & Core", "exercises": (arm_exercises[:4] + core_exercises[:2])[:6]}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    else: # 6 Days
        schedule["Monday"] = {"name": "Push A", "exercises": push_exercises_a}
        schedule["Tuesday"] = {"name": "Pull A", "exercises": pull_exercises_a}
        schedule["Wednesday"] = {"name": "Legs A", "exercises": legs_exercises_a}
        schedule["Thursday"] = {"name": "Push B", "exercises": push_exercises_b}
        schedule["Friday"] = {"name": "Pull B", "exercises": pull_exercises_b}
        schedule["Saturday"] = {"name": "Legs B", "exercises": legs_exercises_b}
    # Append treadmill session to all active workout days
    for day in schedule:
        if schedule[day]["exercises"]:
            schedule[day]["exercises"].append(treadmill_session)

    return {
        "sets": sets,
        "reps": reps,
        "description": desc,
        "rest_timer": timer,
        "schedule": schedule,
        "injury_swaps": injury_swapped
    }


def generate_diet_plan(goal: str, weight: float, age: int, gender: str, height: float, workout_days: int, diet_pref: str = "Veg") -> Dict[str, Any]:
    """
    Generates structured meal suggestions incorporating Indian items based on goals, diet preference, and user metrics.
    """
    # Target values
    metrics = calculate_profile_metrics(age, gender, height, weight, goal, workout_days)
    cal = metrics["target_calories"]
    prot = metrics["target_protein"]
    carb = metrics["target_carbs"]
    fat = metrics["target_fat"]

    meals = {}
    is_veg = diet_pref.lower() == "veg"

    # Helper function to round to sensible increments
    def round_to_nearest(val, step):
        return int(round(val / step) * step)

    # Baseline calculations to scale portion sizes (relative to 2500 kcal / 120g protein baseline)
    cal_factor = cal / 2500.0
    prot_factor = prot / 120.0

    # Scaled portions
    oats_g = round_to_nearest(60 * cal_factor, 5)
    milk_ml = round_to_nearest(250 * cal_factor, 50)
    eggs_count = max(2, min(6, int(round(3 * prot_factor))))
    paneer_g = round_to_nearest(150 * prot_factor, 10)
    rice_g = round_to_nearest(150 * cal_factor, 10)
    chicken_g = round_to_nearest(150 * prot_factor, 10)
    pb_tbsp = max(1, min(3, int(round(2 * cal_factor))))
    almonds_g = round_to_nearest(30 * cal_factor, 5)
    fish_g = round_to_nearest(150 * prot_factor, 10)
    soya_g = round_to_nearest(150 * prot_factor, 10)
    chapatis_count = max(1, min(4, int(round(2 * cal_factor))))
    
    # Weight Loss specific portions
    upma_oats_g = round_to_nearest(40 * cal_factor, 5)
    egg_whites_count = max(2, min(6, int(round(3 * prot_factor))))
    low_fat_paneer_g = round_to_nearest(100 * prot_factor, 10)
    brown_rice_g = round_to_nearest(80 * cal_factor, 5)
    weight_loss_chicken_g = round_to_nearest(150 * prot_factor, 10)
    weight_loss_fish_g = round_to_nearest(150 * prot_factor, 10)
    weight_loss_soya_g = round_to_nearest(100 * prot_factor, 10)
    weight_loss_tofu_g = round_to_nearest(120 * prot_factor, 10)

    if goal == "Muscle Gain" or goal == "Strength":
        if is_veg:
            snack = [
                f"Peanut Butter ({pb_tbsp} tbsp) on 2 slices of Whole Wheat Bread",
                "1 Apple or Orange + Whey Protein Shake (1 scoop with water/milk)"
            ]
            meals = {
                "Monday": {
                    "Breakfast": [
                        f"Oats ({oats_g}g) cooked in Whole Milk ({milk_ml}ml) + 1 Banana + 1 tbsp Honey",
                        f"Paneer Bhurji ({paneer_g}g) with {chapatis_count} Whole Wheat Chapatis",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Basmati Rice ({rice_g}g cooked) + {soya_g}g Soya Chunk Sabji",
                        "Dal Tadka (1 cup) + Mixed Green Salad (Cucumber, Tomato)",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Paneer Tikka ({paneer_g}g) or Grilled Tofu with grilled vegetables (Broccoli, Capsicum)",
                        f"{chapatis_count} Chapatis + Yellow Moong Dal (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Tuesday": {
                    "Breakfast": [
                        f"Moong Dal Cheela (2 pieces) filled with grated paneer ({paneer_g}g)",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)",
                        "1 Glass of Warm Milk"
                    ],
                    "Lunch": [
                        f"Brown Rice ({rice_g}g cooked) + Mix Vegetable Sabji (1.5 cups)",
                        "Chana Masala (1 cup) + Mixed Green Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Paneer/Tofu bhurji ({paneer_g}g) with spinach",
                        f"1 Chapati + Mixed Dal (1 cup)",
                        "1 cup warm milk before sleep"
                    ]
                },
                "Wednesday": {
                    "Breakfast": [
                        f"Upma ({upma_oats_g}g) cooked with vegetables",
                        f"Paneer cubes ({paneer_g}g) sauteed in olive oil",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Quinoa or Rice ({rice_g}g cooked) + Soya Chunk Curry ({soya_g}g)",
                        "Rajma Curry (1 cup) + Cucumber Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Tofu/Paneer Stir Fry ({paneer_g}g) with mushrooms & broccoli",
                        f"1 Chapati + Moong Dal Tadka (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Thursday": {
                    "Breakfast": [
                        "Vegetable Poha cooked with peanuts",
                        f"Paneer Bhurji ({paneer_g}g) with spinach",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Whole Wheat Chapatis ({chapatis_count}) + Paneer Masala ({paneer_g}g)",
                        "Yellow Moong Dal (1 cup) + Green Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Soya Chunk Bhurji ({soya_g}g) with spinach and bell peppers",
                        f"1 Chapati + Dal Fry (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Friday": {
                    "Breakfast": [
                        f"Besan Cheela (2 pieces) + Paneer cubes ({paneer_g}g)",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)",
                        "1 glass whole milk"
                    ],
                    "Lunch": [
                        f"Basmati Rice ({rice_g}g cooked) + Chickpea (Chole) Curry (1 cup)",
                        f"Tofu/Soya Stir Fry ({soya_g}g) + Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Paneer Tikka ({paneer_g}g) with onion & bell peppers",
                        f"1 Chapati + Dal Tadka (1 cup)",
                        "1 cup warm milk before sleep"
                    ]
                },
                "Saturday": {
                    "Breakfast": [
                        f"Oats Upma ({upma_oats_g}g) + Sprouts Salad (1 cup)",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Brown Rice ({rice_g}g cooked) + Palak Paneer ({paneer_g}g)",
                        "Black Dal (1 cup) + Cucumber & Tomato Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Tofu ({paneer_g}g) + Steamed Asparagus & Cauliflower",
                        f"1 Chapati + Green Moong Dal (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Sunday": {
                    "Breakfast": [
                        "Controlled Cheat: Aloo Paratha (1 medium) with 1 tbsp butter & Pickle",
                        "1 Sweet Lassi or Sweet Yogurt (150ml)"
                    ],
                    "Lunch": [
                        f"Controlled Cheat: Vegetable Biryani ({rice_g}g cooked) + Mixed Veg Raita (1 cup)",
                        f"Paneer Butter Masala (Controlled portion: {paneer_g}g)"
                    ],
                    "Snack": ["Controlled Cheat: Handful of Roasted Cashews or Almonds", "1 Whole Wheat Veg Sandwich"],
                    "Dinner": [
                        "Controlled Cheat: Baked Veg Pasta or Veg Noodles with lots of vegetables",
                        "1 cup warm milk before sleep"
                    ]
                }
            }
        else: # Non-Veg
            snack = [
                f"Peanut Butter ({pb_tbsp} tbsp) on 2 slices of Whole Wheat Bread",
                "1 Apple or Orange + Whey Protein Shake (1 scoop with water/milk)"
            ]
            meals = {
                "Monday": {
                    "Breakfast": [
                        f"Oats ({oats_g}g) cooked in Whole Milk ({milk_ml}ml) + 1 Banana + 1 tbsp Honey",
                        f"{eggs_count} Scrambled Eggs with {chapatis_count} Whole Wheat Chapatis",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Basmati Rice ({rice_g}g cooked) + {chicken_g}g Chicken Breast Curry",
                        "Dal Tadka (1 cup) + Mixed Green Salad (Cucumber, Tomato)",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Fish ({fish_g}g) or Grilled Chicken ({chicken_g}g) with grilled vegetables (Broccoli, Capsicum)",
                        f"{chapatis_count} Chapatis + Yellow Moong Dal (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Tuesday": {
                    "Breakfast": [
                        "3 Egg Omelette with spinach & mushrooms",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)",
                        "1 glass whole milk"
                    ],
                    "Lunch": [
                        f"Brown Rice ({rice_g}g cooked) + {chicken_g}g Chicken Stir Fry",
                        "Dal Fry (1 cup) + Cucumber salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Baked Salmon or Fish Curry ({fish_g}g)",
                        f"1 Chapati + Yellow Dal (1 cup)",
                        "1 cup warm milk"
                    ]
                },
                "Wednesday": {
                    "Breakfast": [
                        f"Oats cooked in Whole Milk ({milk_ml}ml) + 1 Banana",
                        "2 Boiled Whole Eggs + 2 Egg Whites",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Jeera Rice ({rice_g}g cooked) + {chicken_g}g Chicken Keema",
                        "Masoor Dal (1 cup) + Green Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({chicken_g}g) with broccoli and carrots",
                        f"1 Chapati + Moong Dal Tadka (1 cup)",
                        "1 cup warm milk before sleep"
                    ]
                },
                "Thursday": {
                    "Breakfast": [
                        "Egg Bhurji (3 eggs) with 1 Whole Wheat Chapati",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Basmati Rice ({rice_g}g cooked) + Fish Curry ({fish_g}g)",
                        "Chana Dal (1 cup) + Mixed Green Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({chicken_g}g) + Bell pepper stir fry",
                        f"1 Chapati + Yellow Dal (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Friday": {
                    "Breakfast": [
                        "Poha with peanuts + 3 Scrambled Eggs",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Brown Rice ({rice_g}g cooked) + {chicken_g}g Chicken Masala",
                        "Yellow Moong Dal (1 cup) + Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Fish Tikka ({fish_g}g) with onion & capsicum",
                        f"1 Chapati + Dal Tadka (1 cup)",
                        "1 cup warm milk before sleep"
                    ]
                },
                "Saturday": {
                    "Breakfast": [
                        f"Oats Upma ({upma_oats_g}g) + 3 Boiled Whole Eggs",
                        f"Handful of Almonds & Walnuts ({almonds_g}g)"
                    ],
                    "Lunch": [
                        f"Brown Rice ({rice_g}g cooked) + Egg Curry (2 whole eggs)",
                        "Black Dal (1 cup) + Salad",
                        "Plain Curd (150g)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({chicken_g}g) with mushrooms & asparagus",
                        f"1 Chapati + Green Moong Dal (1 cup)",
                        "1 cup milk before sleep"
                    ]
                },
                "Sunday": {
                    "Breakfast": [
                        "Controlled Cheat: Chicken Keema Paratha (1 medium) or Egg Paratha with butter",
                        "Sweet Lassi (150ml)"
                    ],
                    "Lunch": [
                        f"Controlled Cheat: Chicken Biryani ({rice_g}g cooked) + Onion Raita (1 cup)"
                    ],
                    "Snack": ["Controlled Cheat: Handful of Roasted Cashews or Almonds", "1 Chicken Tikka Roll (Controlled)"],
                    "Dinner": [
                        f"Controlled Cheat: Grilled Chicken Burger (whole wheat bun, minimal mayo) or Butter Chicken (small portion) with {chapatis_count} Chapatis",
                        "1 cup warm milk before sleep"
                    ]
                }
            }
    elif goal == "Weight Loss":
        if is_veg:
            snack = [
                "Roasted Chana (30g) or 1 Apple",
                "Sprouted Moong Salad (1 small cup) with lemon juice and salt"
            ]
            meals = {
                "Monday": {
                    "Breakfast": [
                        f"Oats Upma ({upma_oats_g}g oats) with carrots, peas, and beans",
                        f"{egg_whites_count} Egg White Omelette or {low_fat_paneer_g}g low-fat Paneer Bhurji with spinach",
                        "Green Tea (no sugar)"
                    ],
                    "Lunch": [
                        f"Boiled Brown Rice ({brown_rice_g}g cooked) or 1 Chapati",
                        f"Boiled Soya Chunks ({weight_loss_soya_g}g) or Double Dal with leafy veggies",
                        "Mixed Salad (Cucumber, Beetroot) + Thin Buttermilk (Chaach) with roasted cumin"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Tofu/Paneer Stir-fry ({weight_loss_tofu_g}g) with Broccoli & Mushrooms",
                        "Clear Vegetable Soup + 1 Chapati (optional)"
                    ]
                },
                "Tuesday": {
                    "Breakfast": [
                        f"Moong Dal Cheela (1 piece) filled with low-fat paneer ({low_fat_paneer_g}g)",
                        "Green Tea (no sugar)"
                    ],
                    "Lunch": [
                        f"Boiled Quinoa ({brown_rice_g}g cooked) + Dal Fry (1 cup)",
                        "Mixed salad + Thin Buttermilk"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Soya Chunk Keema ({weight_loss_soya_g}g) with bell peppers",
                        "Clear Cabbage Soup"
                    ]
                },
                "Wednesday": {
                    "Breakfast": [
                        "Besan Cheela (1 piece) + spinach",
                        "Green Tea"
                    ],
                    "Lunch": [
                        "1 Chapati + Chickpea (Chole) salad (1 cup)",
                        "Mixed salad + Thin Buttermilk"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Tofu ({weight_loss_tofu_g}g) + Steamed veggies",
                        "Tomato soup"
                    ]
                },
                "Thursday": {
                    "Breakfast": [
                        f"Oats porridge ({upma_oats_g}g) in skimmed milk",
                        "Handful of almonds (5)"
                    ],
                    "Lunch": [
                        f"Brown Rice ({brown_rice_g}g cooked) + Yellow Moong Dal (1.5 cups)",
                        "Green Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Low-fat Paneer Tikka ({low_fat_paneer_g}g) with onions & capsicum",
                        "Clear Veg Soup"
                    ]
                },
                "Friday": {
                    "Breakfast": [
                        "Sprouts salad (1 cup) with lemon & cucumber",
                        "Green Tea"
                    ],
                    "Lunch": [
                        "1 Chapati + Rajma Curry (1 cup)",
                        "Cucumber salad + thin buttermilk"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Soya chunk stir-fry ({weight_loss_soya_g}g) with broccoli",
                        "Clear Mushroom Soup"
                    ]
                },
                "Saturday": {
                    "Breakfast": [
                        f"Oats Upma ({upma_oats_g}g) with peas",
                        "Green Tea"
                    ],
                    "Lunch": [
                        f"Boiled Brown Rice ({brown_rice_g}g cooked) + Palak Dal (1.5 cups)",
                        "Mixed Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Tofu ({weight_loss_tofu_g}g) with asparagus",
                        "Clear Veg Soup"
                    ]
                },
                "Sunday": {
                    "Breakfast": [
                        "Veg Poha (1 small bowl) with a few peanuts",
                        "1 cup Filter Coffee / Tea (minimal sugar)"
                    ],
                    "Lunch": [
                        "Controlled Cheat: Veg Pulao or Veg Biryani (1 cup cooked) + Raita (1 cup)"
                    ],
                    "Snack": ["Controlled Cheat: Multi-grain biscuits (2)", "Green Tea"],
                    "Dinner": [
                        "Controlled Cheat: 2 slices Veg Thin-Crust Pizza with lots of veggies or Baked Veg Pasta",
                        "Green Tea"
                    ]
                }
            }
        else: # Non-Veg
            snack = [
                "Roasted Chana (30g) or 1 Apple",
                "Sprouted Moong Salad (1 small cup) with lemon juice and salt"
            ]
            meals = {
                "Monday": {
                    "Breakfast": [
                        f"Oats Upma ({upma_oats_g}g oats) with carrots, peas, and beans",
                        f"{egg_whites_count} Egg White Omelette with spinach",
                        "Green Tea (no sugar)"
                    ],
                    "Lunch": [
                        f"Boiled Brown Rice ({brown_rice_g}g cooked) or 1 Chapati",
                        f"Grilled Chicken Breast ({weight_loss_chicken_g}g) or Fish Tikka ({round_to_nearest(120*prot_factor, 10)}g) with leafy veggies",
                        "Mixed Salad (Cucumber, Beetroot) + Thin Buttermilk (Chaach) with roasted cumin"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Baked Fish ({weight_loss_fish_g}g) or Grilled Chicken Breast ({weight_loss_tofu_g}g) with Broccoli & Mushrooms",
                        "Clear Vegetable Soup + 1 Chapati (optional)"
                    ]
                },
                "Tuesday": {
                    "Breakfast": [
                        "3 Boiled Egg Whites + 1 slice Whole Wheat Toast",
                        "Green Tea"
                    ],
                    "Lunch": [
                        "Boiled Brown Rice + Egg Curry (2 egg whites)",
                        "Mixed salad + Thin Buttermilk"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({weight_loss_chicken_g}g) + Steamed broccoli",
                        "Clear Chicken Soup"
                    ]
                },
                "Wednesday": {
                    "Breakfast": [
                        f"{egg_whites_count} Egg White Scramble with onions & tomatoes",
                        "Green Tea"
                    ],
                    "Lunch": [
                        f"1 Chapati + Grilled Fish ({weight_loss_fish_g}g)",
                        "Cucumber salad + Thin Buttermilk"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Chicken Keema Stir Fry ({weight_loss_chicken_g}g) with spinach",
                        "Tomato Soup"
                    ]
                },
                "Thursday": {
                    "Breakfast": [
                        f"Oats porridge ({upma_oats_g}g) in skimmed milk",
                        "3 Boiled Egg Whites"
                    ],
                    "Lunch": [
                        f"Brown Rice ({brown_rice_g}g cooked) + Yellow Dal (1 cup) + Chicken Breast ({weight_loss_chicken_g}g)",
                        "Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Fish ({weight_loss_fish_g}g) with lemon & herbs",
                        "Clear Veg Soup"
                    ]
                },
                "Friday": {
                    "Breakfast": [
                        "3 Egg White Omelette + spinach",
                        "Green Tea"
                    ],
                    "Lunch": [
                        f"1 Chapati + Chicken Curry ({weight_loss_chicken_g}g)",
                        "Cucumber salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({weight_loss_chicken_g}g) with bell peppers",
                        "Clear Veg Soup"
                    ]
                },
                "Saturday": {
                    "Breakfast": [
                        f"Oats Upma ({upma_oats_g}g) + 2 Boiled Egg Whites",
                        "Green Tea"
                    ],
                    "Lunch": [
                        f"Boiled Brown Rice ({brown_rice_g}g cooked) + Fish Tikka ({weight_loss_fish_g}g)",
                        "Mixed Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({weight_loss_chicken_g}g) + Steamed asparagus",
                        "Clear Chicken Soup"
                    ]
                },
                "Sunday": {
                    "Breakfast": [
                        "Controlled Cheat: Chicken Keema Sandwich (1 slice bread, lean keema)",
                        "Filter Coffee / Tea"
                    ],
                    "Lunch": [
                        "Controlled Cheat: Chicken Biryani (1 cup cooked) + Raita (1 cup)"
                    ],
                    "Snack": ["Controlled Cheat: Multi-grain biscuits (2)", "Green Tea"],
                    "Dinner": [
                        "Controlled Cheat: Grilled Chicken Burger (whole wheat bun, no cheese, minimal sauces)",
                        "Green Tea"
                    ]
                }
            }
    else: # Rehabilitation / Rehab (Balanced Diet)
        # Scale Rehab options
        rehab_rice_cups = round(1.5 * cal_factor * 2) / 2.0
        rehab_rice_cups = max(1.0, min(3.0, rehab_rice_cups))
        rehab_paneer_g = round_to_nearest(100 * prot_factor, 10)
        rehab_chicken_g = round_to_nearest(120 * prot_factor, 10)
        rehab_soya_g = round_to_nearest(120 * prot_factor, 10)
        rehab_eggs = max(2, min(4, eggs_count - 1))

        if is_veg:
            snack = [
                "Roasted Makhana (Lotus seeds) - 1 cup",
                "Black Coffee/Tea + 1 Apple"
            ]
            meals = {
                "Monday": {
                    "Breakfast": [
                        f"Vegetable Poha or Daliya (1 plate) + Sprouts or {rehab_eggs} Boiled Eggs",
                        "1 Glass of Skimmed Milk + 1 Banana"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Basmati Rice or {chapatis_count} Chapatis",
                        f"Paneer Masala ({rehab_paneer_g}g) + 1 cup Dal",
                        "Mixed Salad + Plain Yogurt (1 cup)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Soya Chunk Curry ({rehab_soya_g}g) with 1 Chapati",
                        "Stir-fry Okra (Bhindi) or Cauliflower sabji",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Tuesday": {
                    "Breakfast": [
                        "Besan Cheela (2 pieces) + 1 glass milk",
                        "1 Banana"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Brown Rice",
                        "Mix Veg Sabji + 1 cup Dal",
                        "Mixed Salad + Plain Yogurt (1 cup)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Paneer bhurji ({rehab_paneer_g}g) with 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Wednesday": {
                    "Breakfast": [
                        "Vegetable Upma + Sprouts Salad",
                        "1 Glass of Skimmed Milk"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Basmati Rice",
                        "Rajma Curry + 1 cup Dal",
                        "Mixed Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Soya bhurji ({rehab_soya_g}g) with 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Thursday": {
                    "Breakfast": [
                        "Moong Dal Cheela (2 pieces) + Paneer cubes",
                        "1 Banana"
                    ],
                    "Lunch": [
                        f"{chapatis_count} Chapatis + Chana Masala",
                        "Yellow Dal + Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Tofu ({rehab_paneer_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Friday": {
                    "Breakfast": [
                        "Sprouts salad + Daliya porridge",
                        "1 glass milk"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Basmati Rice",
                        f"Paneer Masala ({rehab_paneer_g}g) + Dal",
                        "Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Soya Chunk Curry ({rehab_soya_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Saturday": {
                    "Breakfast": [
                        "Vegetable Poha + 1 cup milk",
                        "1 Banana"
                    ],
                    "Lunch": [
                        f"{chapatis_count} Chapatis + Palak Paneer",
                        "Dal + Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Paneer ({rehab_paneer_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Sunday": {
                    "Breakfast": [
                        "Controlled Cheat: 1 Aloo Paratha (minimal butter)",
                        "Sweet Lassi (150ml)"
                    ],
                    "Lunch": [
                        "Controlled Cheat: Veg Biryani (1 plate) + Veg Raita"
                    ],
                    "Snack": ["Controlled Cheat: Roasted Cashews (15g)", "Green Tea"],
                    "Dinner": [
                        "Controlled Cheat: 2 slices Veg Pizza or Pasta with veggies",
                        "Warm Milk"
                    ]
                }
            }
        else: # Non-Veg
            snack = [
                "Roasted Makhana (Lotus seeds) - 1 cup",
                "Black Coffee/Tea + 1 Apple"
            ]
            meals = {
                "Monday": {
                    "Breakfast": [
                        f"Vegetable Poha or Daliya (1 plate) + {rehab_eggs} Boiled Eggs",
                        "1 Glass of Skimmed Milk + 1 Banana"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Basmati Rice or {chapatis_count} Chapatis",
                        f"Chicken Curry ({rehab_chicken_g}g) + 1 cup Dal",
                        "Mixed Salad + Plain Yogurt (1 cup)"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Fish Curry ({rehab_chicken_g}g) or Chicken Curry ({rehab_chicken_g}g) with 1 Chapati",
                        "Stir-fry Okra (Bhindi) or Cauliflower sabji",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Tuesday": {
                    "Breakfast": [
                        "Egg bhurji (3 eggs) + 1 slice bread",
                        "1 glass milk"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Brown Rice",
                        f"Chicken Curry ({rehab_chicken_g}g) + 1 cup Dal",
                        "Mixed Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Fish Curry ({rehab_chicken_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Wednesday": {
                    "Breakfast": [
                        "Oats porridge + 2 Boiled Eggs",
                        "1 Glass of Skimmed Milk"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups cooked Basmati Rice",
                        "Chicken Keema + 1 cup Dal",
                        "Mixed Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken ({rehab_chicken_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Thursday": {
                    "Breakfast": [
                        "Egg Omelette (3 eggs) + 1 slice bread",
                        "1 Banana"
                    ],
                    "Lunch": [
                        f"{chapatis_count} Chapatis + Fish Curry ({rehab_chicken_g}g)",
                        "Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Chicken Stir Fry ({rehab_chicken_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Friday": {
                    "Breakfast": [
                        "Daliya porridge + 3 Boiled Eggs",
                        "1 glass milk"
                    ],
                    "Lunch": [
                        f"{rehab_rice_cups} cups Basmati Rice",
                        "Chicken Keema + Dal",
                        "Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Fish Curry ({rehab_chicken_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Saturday": {
                    "Breakfast": [
                        "Vegetable Poha + 2 Boiled Eggs",
                        "1 Banana"
                    ],
                    "Lunch": [
                        f"{chapatis_count} Chapatis + Chicken Curry ({rehab_chicken_g}g)",
                        "Dal + Salad"
                    ],
                    "Snack": snack,
                    "Dinner": [
                        f"Grilled Chicken Breast ({rehab_chicken_g}g) + 1 Chapati",
                        "Warm Milk (1 cup)"
                    ]
                },
                "Sunday": {
                    "Breakfast": [
                        "Controlled Cheat: Egg Paratha (1 medium) with butter",
                        "Sweet Lassi (150ml)"
                    ],
                    "Lunch": [
                        "Controlled Cheat: Chicken Biryani (1 plate) + Raita"
                    ],
                    "Snack": ["Controlled Cheat: Multi-grain biscuits (2)", "Green Tea"],
                    "Dinner": [
                        "Controlled Cheat: 1 Grilled Chicken Burger or chicken roll (Controlled portion)",
                        "Warm Milk"
                    ]
                }
            }

    return {
        "calories": cal,
        "protein": prot,
        "carbs": carb,
        "fat": fat,
        "water_liters": metrics["target_water"],
        "meals": meals
    }
