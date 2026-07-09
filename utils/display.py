# utils/display.py
import cv2

def draw_dashboard(frame, exercise, reps, stage, score, tip, progress, warning="", verify_msg=""):
    """Draws the UI elements on the video frame."""
    
    # Draw Background Panel
    cv2.rectangle(frame, (0, 0), (280, 320), (0, 0, 0), cv2.FILLED)
    
    # Text displays
    cv2.putText(frame, f"Exercise: {exercise.upper()}", (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(frame, f"Reps: {reps}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f"Stage: {stage}", (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
    cv2.putText(frame, f"Score: {score}", (10, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f"Tip: {tip}", (10, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    
    # Draw Progress Bar
    cv2.putText(frame, "Motion:", (10, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.rectangle(frame, (10, 270), (250, 300), (255, 255, 255), 2)
    cv2.rectangle(frame, (10, 270), (10 + int(2.4 * progress), 300), (255, 0, 255), cv2.FILLED)
    cv2.putText(frame, f"{int(progress)}%", (100, 292), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    h, w, _ = frame.shape

    # 🚫 WRONG EXERCISE BANNER (highest priority — covers bottom)
    if verify_msg:
        cv2.rectangle(frame, (0, h - 80), (w, h), (0, 100, 255), cv2.FILLED)
        cv2.putText(frame, "WRONG EXERCISE DETECTED!", (30, h - 50),
                    cv2.FONT_HERSHEY_DUPLEX, 0.85, (255, 255, 255), 2)
        cv2.putText(frame, verify_msg, (30, h - 18),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

    # 🔥 INJURY WARNING BANNER (shown only when exercise is verified)
    elif warning:
        cv2.rectangle(frame, (0, h - 60), (w, h), (0, 0, 255), cv2.FILLED)
        cv2.putText(frame, warning, (30, h - 20),
                    cv2.FONT_HERSHEY_DUPLEX, 1, (255, 255, 255), 2)

    return frame