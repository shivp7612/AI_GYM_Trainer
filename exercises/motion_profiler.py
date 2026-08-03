import time

class MotionProfiler:
    def __init__(self):
        self.stage = "-"
        self.count = 0
        self.last_rep_time = 0
        self.stage_up_time = 0

    def update_reps(self, angle, up, down):
        """
        Dynamically counts reps based on the target angles.
        """
        margin = abs(up - down) * 0.25 # 25% margin of the range of motion
        margin = max(10, min(25, margin)) # clamp margin between 10 and 25 degrees
        now = time.time()

        if up > down:
            if angle > (up - margin): 
                if self.stage != "UP":
                    self.stage = "UP"
                    self.stage_up_time = now
            if angle < (down + margin) and self.stage == "UP":
                # Ensure the rep motion phase took at least 0.7 seconds 
                # and it has been at least 1.2 seconds since the last registered rep
                if (now - self.stage_up_time > 0.7) and (now - self.last_rep_time > 1.2):
                    self.stage = "DOWN"
                    self.count += 1
                    self.last_rep_time = now
                elif now - self.stage_up_time <= 0.7:
                    # Jitter/noise: reset stage to prevent registering false reps
                    self.stage = "-"

        elif up < down:
            if angle < (up + margin):
                if self.stage != "UP":
                    self.stage = "UP"
                    self.stage_up_time = now
            if angle > (down - margin) and self.stage == "UP":
                if (now - self.stage_up_time > 0.7) and (now - self.last_rep_time > 1.2):
                    self.stage = "DOWN"
                    self.count += 1
                    self.last_rep_time = now
                elif now - self.stage_up_time <= 0.7:
                    self.stage = "-"

        return self.count, self.stage