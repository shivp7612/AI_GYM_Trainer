# backend/ai_logic/chatbot.py
import re

def respond_to_chat(message: str) -> str:
    """
    Intelligent pattern-matching chatbot that addresses fitness, posture, injury and nutrition queries.
    """
    msg = message.lower().strip()

    # Question 1: Squats + knee pain
    if re.search(r"squat", msg) and (re.search(r"knee", msg) or re.search(r"hurt", msg) or re.search(r"pain", msg)):
        return (
            "⚠️ **Squats & Knee Pain:** If your knees hurt, you should avoid deep barbell squats. "
            "Instead, try **Glute Bridges**, **Calf Raises**, or **Wall Sits** which are far friendlier on the joints. "
            "If you must squat, limit your range of motion to a 90° angle, make sure your knees don't cave inward, "
            "and ensure your knees do not cross over your toes. If pain continues, take a rest day!"
        )

    # Question 2: Replacing Deadlift
    elif re.search(r"replace", msg) and re.search(r"deadlift", msg):
        return (
            "🔄 **Deadlift Alternatives:** To target your lower back, glutes, and hamstrings without the extreme load of a deadlift, "
            "you can substitute it with:\n"
            "- **Romanian Deadlifts (RDLs)**: Focuses on hinge mechanics with lighter loads.\n"
            "- **Bodyweight Glute Thrusts/Bridges**: Excellent activation with zero spinal compression.\n"
            "- **Back Hyperextensions**: Great for isolated lower back strength.\n"
            "- **Lat Pulldowns / Seated Cable Rows**: For back width and thickness."
        )

    # Question 3: Replacing Military Press / Overhead Press
    elif re.search(r"replace", msg) and (re.search(r"military press", msg) or re.search(r"overhead press", msg) or re.search(r"shoulder press", msg)):
        return (
            "🔄 **Shoulder Press Alternatives:** If shoulder injuries or pain affect your pressing, swap overhead work for:\n"
            "- **Dumbbell Lateral Raises**: Excellent lateral deltoid isolation with minimal joint stress.\n"
            "- **Dumbbell Front Raises**: Hits anterior deltoids safely.\n"
            "- **Face Pulls**: Essential for rear deltoid health and shoulder posture stability."
        )

    # Question 4: Protein guidelines
    elif re.search(r"protein", msg):
        return (
            "🍗 **Protein Guidelines:** For active individuals, the recommended target is **1.5g to 2.2g of protein per kilogram of body weight** daily. "
            "Here are excellent protein sources (including Indian vegetarian and non-vegetarian options):\n"
            "- **Vegetarian**: Paneer (18g protein/100g), Soya Chunks (52g/100g), Greek Yogurt (10g/100g), Moong Dal, Chickpeas, Paneer Bhurji.\n"
            "- **Non-Vegetarian**: Chicken Breast (31g/100g), Whole Eggs (6g per egg), Fish (20-25g/100g).\n"
            "Use the Dashboard trackers to log and keep track of your protein goals!"
        )

    # Question 5: Posture guidelines
    elif re.search(r"posture", msg) or re.search(r"form", msg) or re.search(r"correct", msg):
        return (
            "🎯 **Form & Posture Verification:** To maintain ideal alignment and prevent injury, check these essentials:\n"
            "- **Back Alignment**: Keep your spine neutral (no rounding in deadlifts/rows, no extreme arching in curls).\n"
            "- **Knee Pathing**: Knees should track directly over toes. Prevent them from caving inward during squats.\n"
            "- **Elbow Angle**: Keep elbows tucked to 45° during Bench Presses, and fully extend them on curls.\n"
            "Our AI system tracks joint landmarks. Stand fully in the camera's view, and you will hear real-time voice warnings if your form slips!"
        )

    # Question 6: Rest time
    elif re.search(r"rest", msg) or re.search(r"break", msg) or re.search(r"timer", msg):
        return (
            "⏱️ **Rest Recommendations:** Rest periods should align with your training goal:\n"
            "- **Pure Strength**: Rest **120 to 180 seconds** to allow full ATP (energy) replenishment between heavy sets.\n"
            "- **Hypertrophy (Muscle Gain)**: Rest **75 to 90 seconds** to balance cumulative muscle fatigue and recovery.\n"
            "- **Fat Loss / General Fitness**: Rest **45 seconds** to keep your heart rate elevated and burn more calories.\n"
            "Your workout interface has an automated rest timer that triggers between your sets!"
        )

    # Question 7: Injury alternatives
    elif re.search(r"injury", msg) or re.search(r"pain", msg) or re.search(r"hurt", msg):
        return (
            "🩹 **Injury Advice:** Our AI Workout Planner automatically filters out risky exercises depending on your selected injuries:\n"
            "- **Shoulder injury**: Overhead/Military Presses are removed and replaced with Lateral Raises.\n"
            "- **Knee injury**: Squats/Leg Presses are replaced with Calf Raises/Glute Bridges.\n"
            "- **Back injury**: Romanian Deadlifts and Barbell Rows are replaced with supported chest rows/hyperextensions.\n"
            "Always consult a physical therapist for severe or chronic pain."
        )

    # Question 8: Water intake
    elif re.search(r"water", msg) or re.search(r"drink", msg) or re.search(r"hydrate", msg):
        return (
            "💧 **Hydration Target:** A good base target is **3 to 4 liters of water daily** (roughly 35ml per kg of bodyweight). "
            "During workouts, sip 250ml of water every 15-20 minutes. Proper hydration preserves strength, prevents cramps, and speeds up recovery."
        )

    # Default responses
    else:
        return (
            "👋 Hello! I am your AI Fitness Chatbot. You can ask me questions like:\n"
            "- *Can I do squats if my knee hurts?*\n"
            "- *What exercise replaces Deadlift?*\n"
            "- *How much protein should I eat?*\n"
            "- *Is my posture correct?*\n"
            "- *How long should I rest?*\n"
            "Feel free to ask about any training or dietary advice!"
        )
