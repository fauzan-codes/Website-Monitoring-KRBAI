# app/database/models.py
from sqlalchemy import Column, Integer
from app.database.db import Base

class ThrusterConfig(Base):
    __tablename__ = "thruster_config"

    id = Column(Integer, primary_key=True, index=True)

    front_left = Column(Integer, default=0)
    front_right = Column(Integer, default=0)
    rear_left = Column(Integer, default=0)
    rear_right = Column(Integer, default=0)
    top = Column(Integer, default=0)
    bottom = Column(Integer, default=0)