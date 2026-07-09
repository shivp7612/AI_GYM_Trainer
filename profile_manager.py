# profile_manager.py
import json
import os
from exercises.exercise_dict import WORKOUT_PLAN

PROFILE_FILE = "user_profile.json"

def create_profile():
    """Prompts the user for their details in the terminal."""
    os.system('cls' if os.name == 'nt' else 'clear')
    print("="*50)
    print(" 🤖 WELCOME TO AI GYM TRAINER 🤖 ")
    print("="*50)
    
    name = input("Enter your name: ")
    age = input("Enter your age: ")
    weight = input("Enter your weight (kg): ")
    height = input("Enter your height (cm): ")
    
    print("\nSelect Your Primary Goal:")
    print("1. Muscle Gain (Hypertrophy)")
    print("2. Pure Strength")
    print("3. Weight Loss / Fat Burn")
    print("4. Core & Athleticism")
    
    goal_choice = input("\nEnter the number (1-4): ")
    goals = {"1": "Muscle Gain", "2": "Strength", "3": "Weight Loss", "4": "Core & Athleticism"}
    goal = goals.get(goal_choice, "Muscle Gain") # Default to Muscle Gain if they type it wrong

    profile = {
        "name": name,
        "age": age,
        "weight": weight,
        "height": height,
        "goal": goal
    }
    
    with open(PROFILE_FILE, "w") as f:
        json.dump(profile, f)
        
    return profile

def load_profile():
    """Loads existing profile or creates a new one."""
    if os.path.exists(PROFILE_FILE):
        with open(PROFILE_FILE, "r") as f:
            return json.load(f)
    else:
        return create_profile()

def generate_recommendations(profile):
    """Generates a custom workout and diet plan based on the user's goal."""
    os.system('cls' if os.name == 'nt' else 'clear')
    print("="*50)
    print(f" 🎯 CUSTOM PLAN FOR: {profile['name'].upper()} 🎯 ")
    print(f" Goal: {profile['goal']} | Weight: {profile['weight']}kg")
    print("="*50)

    goal = profile["goal"]
    
    # --- DIET RECOMMENDATIONS ---
    print("\n🍽️  AI DIET RECOMMENDATION:")
    if goal == "Muscle Gain":
        print("- Calories: SURPLUS (+300 to 500 kcal above maintenance)")
        print("- Protein: 1.8g - 2.2g per kg of body weight.")
        print("- Carbs: High carbs to fuel intense muscle-building workouts.")
        print("- Focus: Chicken, rice, oats, eggs, beef, and whole milk.")
    elif goal == "Strength":
        print("- Calories: MAINTENANCE or Slight Surplus")
        print("- Protein: 1.6g - 2.0g per kg of body weight.")
        print("- Carbs: Very high carbs around workout times for maximum energy output.")
        print("- Focus: Dense foods, potatoes, pasta, red meat, nuts.")
    elif goal == "Weight Loss":
        print("- Calories: DEFICIT (-300 to 500 kcal below maintenance)")
        print("- Protein: 2.0g+ per kg (Crucial to prevent muscle loss while losing fat).")
        print("- Carbs: Low/Moderate. Focus on high-volume, low-calorie foods.")
        print("- Focus: Lean fish, chicken breast, massive amounts of green veggies, egg whites.")
    elif goal == "Core & Athleticism":
        print("- Calories: MAINTENANCE")
        print("- Protein: 1.5g per kg.")
        print("- Focus: Balanced macros. Stay hydrated. Lean meats, fruits, and complex carbs.")

    # --- WORKOUT RECOMMENDATIONS ---
    print("\n🏋️  AI WORKOUT PLAN (Using your app's exercises):")
    if goal == "Muscle Gain":
        print("- Style: 3 Sets of 8-12 Reps. Focus on slow, controlled movement.")
        print(f"- Chest Day: {', '.join(list(WORKOUT_PLAN['Chest'].keys())[:2]).replace('_', ' ').title()}")
        print(f"- Back Day:  {', '.join(list(WORKOUT_PLAN['Back'].keys())[:2]).replace('_', ' ').title()}")
        print(f"- Leg Day:   {', '.join(list(WORKOUT_PLAN['Legs'].keys())[:2]).replace('_', ' ').title()}")
    elif goal == "Strength":
        print("- Style: 5 Sets of 3-5 Reps. Long rest periods (3+ minutes).")
        print(f"- Primary Lifts: Barbell Bench Press, Barbell Row, Squat, Overhead Press.")
        print("- Note: Use your app to ensure perfect form. Injury risk is highest here.")
    elif goal == "Weight Loss":
        print("- Style: Circuit Training. 4 Sets of 15+ Reps. Minimal rest between sets.")
        print(f"- Full Body A: Squat, Pushup (or Bench), Lat Pulldown, Crunches.")
        print(f"- Full Body B: Romanian Deadlift, Overhead Press, Cable Row, Leg Raises.")
    elif goal == "Core & Athleticism":
        print("- Style: 3 Sets of 12-15 Reps. Focus on explosive movement and stability.")
        print(f"- Routine: {', '.join(WORKOUT_PLAN['Core'].keys()).replace('_', ' ').title()}")
        print("- Add Lunges and Pullups for functional body control.")

    print("\n" + "="*50)
    input("Press ENTER to launch the camera and begin your workout...")