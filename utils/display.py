# utils/display.py
import cv2

def draw_dashboard(frame, exercise, reps, stage, score, tip, progress, warning="", verify_msg=""):
    """Draws the UI elements on the video frame."""
    
    h, w, _ = frame.shape

    # ── LEFT PANEL (stats) ────────────────────────────────────────
    panel_w = 290
    cv2.rectangle(frame, (0, 0), (panel_w, 300), (0, 0, 0), cv2.FILLED)

    cv2.putText(frame, f"Exercise:", (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (150, 150, 150), 1)
    cv2.putText(frame, exercise.upper(), (10, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 255), 2)

    cv2.putText(frame, f"Reps:  {reps}", (10, 105),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    cv2.putText(frame, f"Stage: {stage}", (10, 140),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 80, 80), 2)
    cv2.putText(frame, f"Score: {score}", (10, 175),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)
    cv2.putText(frame, f"Tip:   {tip}", (10, 210),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 255), 2)

    # Progress bar
    cv2.putText(frame, "Motion:", (10, 250),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
    cv2.rectangle(frame, (10, 265), (270, 290), (255, 255, 255), 2)
    cv2.rectangle(frame, (10, 265), (10 + int(2.6 * progress), 290),
                  (255, 0, 255), cv2.FILLED)
    cv2.putText(frame, f"{int(progress)}%", (120, 285),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    # ── BOTTOM BANNERS & "PRESS M" HINT ──────────────────────────────
    banner_h = 85
    hint_text = "Press 'M' to change exercise"
    hint_font = cv2.FONT_HERSHEY_SIMPLEX
    hint_scale = 0.6
    hint_thickness = 2
    (text_w, text_h), _ = cv2.getTextSize(hint_text, hint_font, hint_scale, hint_thickness)

    if verify_msg:
        # Orange WRONG EXERCISE banner — bottom of screen
        cv2.rectangle(frame, (0, h - banner_h), (w, h), (0, 110, 255), cv2.FILLED)
        
        # Alert title (top-left of banner)
        cv2.putText(frame, "  WRONG EXERCISE DETECTED!",
                    (10, h - banner_h + 32),
                    cv2.FONT_HERSHEY_DUPLEX, 0.9, (255, 255, 255), 2)
        
        # Calculate verify_msg scale dynamically to fit in the left side
        max_msg_w = w - text_w - 50
        msg_scale = 0.65
        msg_thickness = 2
        while msg_scale > 0.4:
            (msg_w, _), _ = cv2.getTextSize(f"  {verify_msg}", cv2.FONT_HERSHEY_SIMPLEX, msg_scale, msg_thickness)
            if msg_w <= max_msg_w:
                break
            msg_scale -= 0.05

        # Alert message (bottom-left of banner, dynamically scaled to fit)
        cv2.putText(frame, f"  {verify_msg}",
                    (10, h - banner_h + 65),
                    cv2.FONT_HERSHEY_SIMPLEX, msg_scale, (255, 255, 0), msg_thickness)
        
        # Hint text (bottom-right of banner, side-by-side with message)
        cv2.putText(frame, hint_text, (w - text_w - 20, h - banner_h + 65),
                    hint_font, hint_scale, (255, 255, 255), hint_thickness)

    elif warning:
        # Red INJURY WARNING banner — bottom of screen
        cv2.rectangle(frame, (0, h - banner_h), (w, h), (0, 0, 200), cv2.FILLED)
        
        # Calculate warning scale dynamically to fit in the left side
        max_warn_w = w - text_w - 50
        warn_scale = 0.9
        warn_thickness = 2
        while warn_scale > 0.4:
            (warn_w, _), _ = cv2.getTextSize(f"  {warning}", cv2.FONT_HERSHEY_DUPLEX, warn_scale, warn_thickness)
            if warn_w <= max_warn_w:
                break
            warn_scale -= 0.05

        # Warning message (left side of banner, dynamically scaled to fit)
        cv2.putText(frame, f"  {warning}",
                    (10, h - int(banner_h / 2) + 10),
                    cv2.FONT_HERSHEY_DUPLEX, warn_scale, (255, 255, 255), warn_thickness)
        
        # Hint text (right side of banner)
        cv2.putText(frame, hint_text, (w - text_w - 20, h - int(banner_h / 2) + 10),
                    hint_font, hint_scale, (255, 255, 255), hint_thickness)

    else:
        # No banner — draw hint at bottom-right with a clean semi-transparent background box
        hint_y = h - 20
        box_padding = 8
        box_x1 = w - text_w - 20 - box_padding
        box_y1 = hint_y - text_h - box_padding
        box_x2 = w - 20 + box_padding
        box_y2 = hint_y + box_padding

        overlay = frame.copy()
        cv2.rectangle(overlay, (box_x1, box_y1), (box_x2, box_y2), (0, 0, 0), cv2.FILLED)
        cv2.addWeighted(overlay, 0.55, frame, 0.45, 0, frame)

        # Draw the hint text on top
        cv2.putText(frame, hint_text, (w - text_w - 20, hint_y),
                    hint_font, hint_scale, (255, 255, 255), hint_thickness)

    return frame