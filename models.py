from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicles = relationship("Vehicle", back_populates="owner")

class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    make_model = Column(String)
    registration_number = Column(String, unique=True, index=True)
    owner = relationship("Customer", back_populates="vehicles")
    bookings = relationship("Booking", back_populates="vehicle")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    preferred_date = Column(String, nullable=True)
    description = Column(String)
    status = Column(String, default="Pending")
    technician = Column(String, nullable=True)
    expected_completion = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    vehicle = relationship("Vehicle", back_populates="bookings")

class ConversationState(Base):
    __tablename__ = "conversation_states"
    phone_number = Column(String, primary_key=True, index=True)
    current_step = Column(String, nullable=True)
    context_data = Column(JSON, default={})
    is_escalated = Column(Boolean, default=False)
