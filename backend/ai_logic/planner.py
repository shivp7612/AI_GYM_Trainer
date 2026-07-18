# backend/ai_logic/planner.py
from typing import List, Dict, Any

def calculate_profile_metrics(age: int, gender: str, height: float, weight: float, goal: str) -> Dict[str, Any]:
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
    
    # 4. TDEE (Assume moderate activity multiplier of 1.375)
    tdee = bmr * 1.375

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


def generate_workout_plan(experience: str, goal: str, equipment: List[str], injuries: List[str], workout_days: int) -> Dict[str, Any]:
    """
    Generates a structured weekly workout plan based on user profile.
    Swaps out unsafe exercises for injuries.
    """
    # Base exercises by muscle group and equipment availability
    # Schema: category -> { exercise_key: display_name }
    is_home = "Home" in equipment or len(equipment) == 1 and "Bodyweight" in equipment
    is_gym = "Gym" in equipment
    has_dumbbells = "Dumbbells" in equipment or is_gym
    has_bands = "Resistance Bands" in equipment or "Resistance Band" in equipment

    # Map categories to workouts
    chest_exercises = []
    back_exercises = []
    shoulder_exercises = []
    arm_exercises = []
    leg_exercises = []
    core_exercises = []

    # Populate exercises based on equipment
    if is_gym:
        chest_exercises = [("barbell_bench_press", "Barbell Bench Press"), ("incline_dumbbell_press", "Incline Dumbbell Press"), ("cable_fly_pec_deck", "Cable Fly / Pec Deck")]
        back_exercises = [("pullup_chinup", "Wide Grip Pull-up"), ("lat_pulldown", "Lat Pulldown"), ("barbell_row", "Bent-over Barbell Row")]
        shoulder_exercises = [("overhead_press", "Barbell Overhead Press"), ("lateral_raise", "Dumbbell Lateral Raise"), ("front_raise", "Dumbbell Front Raise")]
        arm_exercises = [("bicep_curl", "Dumbbell Bicep Curl"), ("tricep_pushdown", "Cable Tricep Pushdown"), ("overhead_tricep_extension", "Dumbbell Overhead Tricep Extension")]
        leg_exercises = [("squat", "Barbell Squat"), ("leg_press", "Leg Press"), ("romanian_deadlift", "Romanian Deadlift"), ("calf_raise", "Standing Calf Raise")]
        core_exercises = [("crunches", "Abdominal Crunches"), ("leg_raises", "Lying Leg Raises"), ("russian_twist", "Russian Twist")]
    elif has_dumbbells:
        chest_exercises = [("incline_dumbbell_press", "Dumbbell Bench Press"), ("pushup", "Regular Push-up")]
        back_exercises = [("barbell_row", "Dumbbell Row"), ("pullup_chinup", "Chin-up (if bar available)")]
        shoulder_exercises = [("overhead_press", "Dumbbell Overhead Press"), ("lateral_raise", "Dumbbell Lateral Raise")]
        arm_exercises = [("bicep_curl", "Dumbbell Bicep Curl"), ("overhead_tricep_extension", "Dumbbell Tricep Extension")]
        leg_exercises = [("squat", "Goblet Squat"), ("romanian_deadlift", "Dumbbell Romanian Deadlift"), ("calf_raise", "Dumbbell Calf Raise")]
        core_exercises = [("crunches", "Abdominal Crunches"), ("leg_raises", "Lying Leg Raises"), ("russian_twist", "Weighted Russian Twist")]
    else: # Bodyweight / bands
        chest_exercises = [("pushup", "Regular Push-up")]
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

    # Build weekly schedule
    schedule = {}
    if workout_days == 2:
        schedule["Monday"] = {"name": "Full Body A", "exercises": chest_exercises[:1] + back_exercises[:1] + leg_exercises[:2]}
        schedule["Tuesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Wednesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Thursday"] = {"name": "Full Body B", "exercises": shoulder_exercises[:1] + arm_exercises[:2] + core_exercises[:2]}
        schedule["Friday"] = {"name": "Rest Day", "exercises": []}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    elif workout_days == 3:
        schedule["Monday"] = {"name": "Push Day", "exercises": chest_exercises + shoulder_exercises[:1] + arm_exercises[1:2]}
        schedule["Tuesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Wednesday"] = {"name": "Pull Day", "exercises": back_exercises + arm_exercises[:1]}
        schedule["Thursday"] = {"name": "Rest Day", "exercises": []}
        schedule["Friday"] = {"name": "Legs & Core", "exercises": leg_exercises + core_exercises}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    elif workout_days == 4:
        schedule["Monday"] = {"name": "Chest & Triceps", "exercises": chest_exercises + arm_exercises[1:2]}
        schedule["Tuesday"] = {"name": "Back & Biceps", "exercises": back_exercises + arm_exercises[:1]}
        schedule["Wednesday"] = {"name": "Rest Day", "exercises": []}
        schedule["Thursday"] = {"name": "Shoulders & Core", "exercises": shoulder_exercises + core_exercises}
        schedule["Friday"] = {"name": "Legs", "exercises": leg_exercises}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    elif workout_days == 5:
        schedule["Monday"] = {"name": "Chest Workout", "exercises": chest_exercises}
        schedule["Tuesday"] = {"name": "Back Workout", "exercises": back_exercises}
        schedule["Wednesday"] = {"name": "Leg Workout", "exercises": leg_exercises}
        schedule["Thursday"] = {"name": "Shoulder Workout", "exercises": shoulder_exercises}
        schedule["Friday"] = {"name": "Arms & Core", "exercises": arm_exercises + core_exercises}
        schedule["Saturday"] = {"name": "Rest Day", "exercises": []}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}
    else: # 6 Days
        schedule["Monday"] = {"name": "Push A", "exercises": chest_exercises[:2] + shoulder_exercises[:1] + arm_exercises[1:2]}
        schedule["Tuesday"] = {"name": "Pull A", "exercises": back_exercises[:2] + arm_exercises[:1]}
        schedule["Wednesday"] = {"name": "Legs A", "exercises": leg_exercises[:2] + core_exercises[:1]}
        schedule["Thursday"] = {"name": "Push B", "exercises": chest_exercises[1:3] + shoulder_exercises[1:2]}
        schedule["Friday"] = {"name": "Pull B", "exercises": back_exercises[1:3] + arm_exercises[2:3]}
        schedule["Saturday"] = {"name": "Legs B", "exercises": leg_exercises[2:4] + core_exercises[1:3]}
        schedule["Sunday"] = {"name": "Rest Day", "exercises": []}

    return {
        "sets": sets,
        "reps": reps,
        "description": desc,
        "rest_timer": timer,
        "schedule": schedule,
        "injury_swaps": injury_swapped
    }


def generate_diet_plan(goal: str, weight: float) -> Dict[str, Any]:
    """
    Generates structured meal suggestions incorporating Indian items based on goals.
    """
    # Target values
    metrics = calculate_profile_metrics(25, "male", 175, weight, goal)
    cal = metrics["target_calories"]
    prot = metrics["target_protein"]
    carb = metrics["target_carbs"]
    fat = metrics["target_fat"]

    meals = {}
    if goal == "Muscle Gain" or goal == "Strength":
        meals = {
            "Breakfast": [
                "Oats (60g) cooked in Whole Milk (250ml) + 1 Banana + 1 tbsp Honey",
                "3 Scrambled Eggs or 150g Paneer Bhurji with 2 Whole Wheat Chapatis",
                "Handful of Almonds & Walnuts (30g)"
            ],
            "Lunch": [
                "Basmati Rice (150g cooked) + 150g Chicken Breast Curry or 150g Soya Chunk Sabji",
                "Dal Tadka (1 cup) + Mixed Green Salad (Cucumber, Tomato)",
                "Greek Yogurt or Plain Curd (150g)"
            ],
            "Snack": [
                "Peanut Butter (2 tbsp) on 2 slices of Whole Wheat Bread",
                "1 Apple or Orange + Whey Protein Shake (1 scoop with water/milk)"
            ],
            "Dinner": [
                "Grilled Fish (150g) or Paneer Tikka (150g) with grilled vegetables (Broccoli, Capsicum)",
                "2 Chapatis + Yellow Moong Dal (1 cup)",
                "1 cup milk before sleep"
            ]
        }
    elif goal == "Weight Loss":
        meals = {
            "Breakfast": [
                "Oats Upma (40g oats) with plenty of carrots, peas, and beans",
                "3 Egg White Omelette or 100g low-fat Paneer Bhurji with spinach",
                "Green Tea (no sugar)"
            ],
            "Lunch": [
                "Boiled Brown Rice (80g cooked) or 1 Chapati",
                "Grilled Chicken Breast (150g) or Boiled Soya Chunks (100g) with leafy veggies",
                "Mixed Salad (Cucumber, Beetroot, Onion) + Thin Buttermilk (Chaach) with roasted cumin"
            ],
            "Snack": [
                "Roasted Chana (30g) or 1 Apple",
                "Sprouted Moong Salad (1 small cup) with lemon juice and salt"
            ],
            "Dinner": [
                "Baked Fish (150g) or Tofu/Paneer Stir-fry (120g) with Broccoli & Mushrooms",
                "Clear Vegetable Soup + 1 Chapati (optional)"
            ]
        }
    else: # General Fitness / Rehab (Balanced Diet)
        meals = {
            "Breakfast": [
                "Vegetable Poha or Daliya (1 plate) + 2 Boiled Eggs or Sprouts",
                "1 Glass of Skimmed Milk + 1 Banana"
            ],
            "Lunch": [
                "1.5 cups cooked Basmati Rice or 2 Chapatis",
                "Chicken Curry (120g) or Paneer Masala (100g) + 1 cup Dal",
                "Mixed Salad + Plain Yogurt (1 cup)"
            ],
            "Snack": [
                "Roasted Makhana (Lotus seeds) - 1 cup",
                "Black Coffee/Tea + 1 Apple"
            ],
            "Dinner": [
                "Soya Chunk Curry or Fish Curry (120g) with 1 Chapati",
                "Stir-fry Bhindi (Okra) or Cauliflower sabji",
                "Warm Milk (1 cup)"
            ]
        }

    return {
        "calories": cal,
        "protein": prot,
        "carbs": carb,
        "fat": fat,
        "water_liters": metrics["target_water"],
        "meals": meals
    }
