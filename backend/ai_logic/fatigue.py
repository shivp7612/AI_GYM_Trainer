# backend/ai_logic/fatigue.py
import numpy as np
import time
from typing import List, Tuple

class FatigueTracker:
    def __init__(self):
        self.reset()

    def reset(self):
        self.rep_start_time = None
        self.rep_durations = []
        self.peak_flexion_angles = []
        self.peak_extension_angles = []
        self.joint_positions_buffer = []  # To track trembling
        self.baseline_hip_y = None
        self.baseline_shoulder_y = None
        
        self.current_fatigue = 0.0
        self.recommendation = "Keep training"

    def record_rep_start(self):
        self.rep_start_time = time.time()

    def record_rep_end(self, flex_angle: float, ext_angle: float):
        if self.rep_start_time:
            duration = time.time() - self.rep_start_time
            self.rep_durations.append(duration)
            self.rep_start_time = None
        
        self.peak_flexion_angles.append(flex_angle)
        self.peak_extension_angles.append(ext_angle)

    def update_frame_data(self, lmList: list, active_joint_idx: int) -> Tuple[float, str]:
        """
        Updates tracking buffer for frame-level fatigue analysis (trembling, posture drift).
        Returns (fatigue_percent, recommendation_string)
        """
        if len(lmList) < 29:
            return 0.0, "Stand fully in frame"

        # 1. Track trembling (active joint fluctuations)
        joint_coord = lmList[active_joint_idx][1:3]  # (x, y)
        self.joint_positions_buffer.append(joint_coord)
        if len(self.joint_positions_buffer) > 30:  # Keep past 30 frames
            self.joint_positions_buffer.pop(0)

        tremble_score = 0.0
        if len(self.joint_positions_buffer) >= 15:
            # Calculate acceleration changes (high frequency shifts)
            coords = np.array(self.joint_positions_buffer)
            diffs = np.diff(coords, axis=0)
            accel = np.diff(diffs, axis=0)
            # Standard deviation of acceleration indicates stability/tremble
            tremble_score = float(np.std(accel) * 12)
            tremble_score = min(35.0, tremble_score) # Cap at 35% contribution

        # 2. Track Hip/Shoulder Sag (Posture changes)
        l_hip_y = lmList[23][2]
        r_hip_y = lmList[24][2]
        avg_hip_y = (l_hip_y + r_hip_y) / 2.0
        
        l_shoulder_y = lmList[11][2]
        r_shoulder_y = lmList[12][2]
        avg_shoulder_y = (l_shoulder_y + r_shoulder_y) / 2.0

        if self.baseline_hip_y is None:
            self.baseline_hip_y = avg_hip_y
            self.baseline_shoulder_y = avg_shoulder_y

        posture_drift = 0.0
        # If hips or shoulders sag downward heavily compared to initial frames
        hip_sag = avg_hip_y - self.baseline_hip_y
        sh_sag = avg_shoulder_y - self.baseline_shoulder_y
        if hip_sag > 25 or sh_sag > 25:
            posture_drift = min(20.0, max(hip_sag, sh_sag) * 0.5)

        # 3. Speed degradation score
        speed_score = 0.0
        if len(self.rep_durations) >= 2:
            first_rep_time = self.rep_durations[0]
            current_rep_time = self.rep_durations[-1]
            # If current rep takes twice as long as the first one
            if current_rep_time > first_rep_time:
                speed_score = min(30.0, ((current_rep_time / first_rep_time) - 1.0) * 40.0)

        # 4. Reduced Range of Motion (ROM)
        rom_score = 0.0
        if len(self.peak_flexion_angles) >= 2 and len(self.peak_extension_angles) >= 2:
            first_rom = abs(self.peak_extension_angles[0] - self.peak_flexion_angles[0])
            current_rom = abs(self.peak_extension_angles[-1] - self.peak_flexion_angles[-1])
            if current_rom < first_rom and first_rom > 0:
                rom_reduction = (first_rom - current_rom) / first_rom
                rom_score = min(25.0, rom_reduction * 80.0)

        # Total fatigue calculation
        total_fatigue = tremble_score + posture_drift + speed_score + rom_score
        self.current_fatigue = round(min(100.0, total_fatigue), 1)

        # Generate recommendation
        if self.current_fatigue >= 80.0:
            self.recommendation = "Fatigue high (80%+). Stop current set to prevent injury!"
        elif self.current_fatigue >= 55.0:
            self.recommendation = "Fatigue medium. Slow down, prioritize form."
        else:
            self.recommendation = "Good form. Keep going!"

        return self.current_fatigue, self.recommendation
