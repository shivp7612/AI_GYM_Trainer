# exercises/motion_profiler.py

class MotionProfiler:
    def __init__(self):
        self.stage = "-"
        self.count = 0

    def update_reps(self, angle, up, down):
        """
        Dynamically counts reps based on the target angles.
        Works for all 40+ exercises automatically without needing the exercise name!
        """
        if up > down:
            if angle > (up - 10): 
                self.stage = "UP"
            if angle < (down + 10) and self.stage == "UP":
                self.stage = "DOWN"
                self.count += 1

        elif up < down:
            if angle < (up + 10):
                self.stage = "UP"
            if angle > (down - 10) and self.stage == "UP":
                self.stage = "DOWN"
                self.count += 1

        return self.count, self.stage