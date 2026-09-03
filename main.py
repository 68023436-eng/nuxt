from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import Session

# ดึงตัวเชื่อมต่อจากไฟล์ database.py ในโฟลเดอร์ Database
from Database.database import Base, SessionLocal, engine


# 1. โครงสร้างตารางใน Database (เพิ่ม phone_number และ department แล้ว)
class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    license_plate = Column(String, nullable=False)
    department = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# สั่งสร้างตาราง appointments ลงใน Supabase ทันทีถ้ายังไม่มี
Base.metadata.create_all(bind=engine)

app = FastAPI()

# ตั้งค่า CORS ให้ฝั่ง Nuxt (localhost:3000 หรือ 3001) เรียกใช้ได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 2. Schema ตัวรับข้อมูลจากฟอร์มหน้าเว็บ
class AppointmentCreate(BaseModel):
    patient_name: str
    phone_number: str
    license_plate: str
    department: str


# 3. Schema สำหรับ response (แก้ปัญหา serialization ของ datetime)
class AppointmentResponse(BaseModel):
    id: int
    patient_name: str
    phone_number: str
    license_plate: str
    department: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# API บันทึกข้อมูลใบนัด (POST)
@app.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(
    payload: AppointmentCreate, db: Session = Depends(get_db)
):
    new_item = Appointment(
        patient_name=payload.patient_name,
        phone_number=payload.phone_number,
        license_plate=payload.license_plate,
        department=payload.department,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# API ดึงรายการใบนัดทั้งหมด (GET)
@app.get("/api/appointments", response_model=list[AppointmentResponse])
def get_appointments(db: Session = Depends(get_db)):
    return db.query(Appointment).order_by(Appointment.created_at.desc()).all()


# API ลบรายการใบนัด (DELETE)
@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    item = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบรายการนัดหมายนี้")
    db.delete(item)
    db.commit()
    return {"status": "success", "message": "ลบรายการสำเร็จ"}