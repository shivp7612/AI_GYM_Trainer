# backend/models.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
import datetime
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    history = relationship("WorkoutHistory", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    photos = relationship("ProgressPhoto", back_populates="user", cascade="all, delete-orphan")
    daily_intakes = relationship("DailyIntake", back_populates="user", cascade="all, delete-orphan")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    age = Column(Integer)
    gender = Column(String)
    height = Column(Float) # in cm
    weight = Column(Float) # in kg
    goal = Column(String)
    experience = Column(String)
    equipment = Column(JSON)  # Stores equipment options selected (list of strings)
    injury = Column(JSON)     # Stores injuries checklist (list of strings)
    workout_days = Column(Integer, default=4)
    
    # Calculated fields
    bmi = Column(Float)
    body_fat_est = Column(Float)
    target_calories = Column(Integer)
    target_protein = Column(Integer) # grams/day
    target_water = Column(Float)     # liters/day
    sleep_hours = Column(Float)
    target_weight = Column(Float)
    goal_time_weeks = Column(Integer)

    user = relationship("User", back_populates="profile")

class WorkoutHistory(Base):
    __tablename__ = "workout_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    exercise = Column(String)
    reps = Column(Integer)
    sets = Column(Integer)
    duration = Column(Float)    # in minutes
    accuracy = Column(Float)   # percentage (0-100)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Extra detailed stats
    calories_burned = Column(Float)
    avg_fatigue = Column(Float) # 0-100
    risk_score = Column(String) # Low, Medium, High

    user = relationship("User", back_populates="history")

class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    date = Column(DateTime, default=datetime.datetime.utcnow)
    weight = Column(Float)
    bmi = Column(Float)
    calories_burned = Column(Float)
    duration = Column(Float) # in minutes

    user = relationship("User", back_populates="progress_logs")

class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    date = Column(DateTime, default=datetime.datetime.utcnow)
    photo_path = Column(String) # path to stored image file

    user = relationship("User", back_populates="photos")

class DailyIntake(Base):
    __tablename__ = "daily_intakes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    date = Column(DateTime, default=datetime.date.today)
    water_liters = Column(Float, default=0.0)
    protein_grams = Column(Integer, default=0)
    calories_kcal = Column(Integer, default=0)

    user = relationship("User", back_populates="daily_intakes")
