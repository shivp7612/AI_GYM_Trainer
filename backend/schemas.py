# backend/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

class UserCreate(BaseModel):
    name: str

class UserResponse(BaseModel):
    id: int
    name: str
    created_at: datetime.datetime

    class Config:
        orm_mode = True

class UserProfileCreate(BaseModel):
    age: int
    gender: str
    height: float # cm
    weight: float # kg
    goal: str
    experience: str
    equipment: List[str]
    injury: List[str]
    workout_days: int

class UserProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    gender: str
    height: float
    weight: float
    goal: str
    experience: str
    equipment: List[str]
    injury: List[str]
    workout_days: int
    
    # Calculated properties
    bmi: float
    body_fat_est: float
    target_calories: int
    target_protein: int
    target_water: float
    sleep_hours: float
    target_weight: float
    goal_time_weeks: int

    class Config:
        orm_mode = True

class WorkoutHistoryCreate(BaseModel):
    exercise: str
    reps: int
    sets: int
    duration: float
    accuracy: float
    calories_burned: float
    avg_fatigue: float
    risk_score: str

class WorkoutHistoryResponse(BaseModel):
    id: int
    user_id: int
    exercise: str
    reps: int
    sets: int
    duration: float
    accuracy: float
    date: datetime.datetime
    calories_burned: float
    avg_fatigue: float
    risk_score: str

    class Config:
        orm_mode = True

class ProgressLogCreate(BaseModel):
    weight: float
    calories_burned: float
    duration: float

class ProgressLogResponse(BaseModel):
    id: int
    user_id: int
    date: datetime.datetime
    weight: float
    bmi: float
    calories_burned: float
    duration: float

    class Config:
        orm_mode = True

class ProgressPhotoResponse(BaseModel):
    id: int
    user_id: int
    date: datetime.datetime
    photo_path: str

    class Config:
        orm_mode = True

class DailyIntakeUpdate(BaseModel):
    water_liters: Optional[float] = 0.0
    protein_grams: Optional[int] = 0
    calories_kcal: Optional[int] = 0

class DailyIntakeResponse(BaseModel):
    id: int
    user_id: int
    date: datetime.date
    water_liters: float
    protein_grams: int
    calories_kcal: int

    class Config:
        orm_mode = True

class ReadinessCheck(BaseModel):
    sleep_hours: float
    soreness_level: int = Field(..., ge=1, le=10) # 1-10
    energy_level: int = Field(..., ge=1, le=10) # 1-10

class ChatMessage(BaseModel):
    sender: str
    message: str

class ChatResponse(BaseModel):
    reply: str

class StartWorkoutRequest(BaseModel):
    exercise: str
