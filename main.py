import re
import secrets
from datetime import date, datetime
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Session
from Database.database import Base, SessionLocal, engine    # ดึง Base และ engine จากโฟลเดอร์ Database

# โครงสร้างตารางใน Database (เพิ่ม phone_number และ department แล้ว)
class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, index=True)
    qr_token = Column(String, unique=True, index=True)
    patient_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    license_plate = Column(String, nullable=False)
    dept_id = Column(Integer, ForeignKey("hospital_dept.dept_id"))
    appointment_date = Column(Date, nullable=False)
    time_slot = Column(String, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    location_id = Column(
        Integer, ForeignKey("hospital_parking.location_id"), default=1
    )




Base.metadata.create_all(bind=engine)               # สั่งสร้างตาราง appointments ลงใน Supabase ทันทีถ้ายังไม่มี
app = FastAPI()
app.add_middleware(                                 # ตั้งค่า CORS ให้ฝั่ง Nuxt (localhost:3000 หรือ 3001) เรียกใช้ได้
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class HospitalDept(Base):
    __tablename__ = "hospital_dept"
    dept_id = Column(Integer, primary_key=True, index=True)
    dept_code = Column(String)
    dept_name_th = Column(String)
    dept_name_en = Column(String)
    class Config:
        from_attributes = True

class HospitalParking(Base):
    __tablename__ = "hospital_parking"
    location_id = Column(Integer, primary_key=True, index=True)
    building_name = Column(String)
    clinic_floor = Column(String)
    map_url = Column(String)




# Schema ตัวรับข้อมูลจากฟอร์มหน้าเว็บ (ตรวจสอบเบื้องต้นด้วย Pydantic)
class AppointmentCreate(BaseModel):
    patient_name: str = Field(min_length=1, max_length=100)
    phone_number: str
    license_plate: str = Field(min_length=1, max_length=20)
    dept_id: int = Field(gt=0)
    appointment_date: date
    time_slot: str = Field(min_length=1, max_length=30)




# Schema สำหรับ response (แก้ปัญหา serialization ของ datetime + ไม่รั่วไหลคอลัมน์ที่ไม่จำเป็น)
class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    appointment_id: int
    patient_name: str
    phone_number: str
    license_plate: str
    dept_id: int
    department: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


ALLOWED_TIME_SLOTS = {"09:00 - 12:00", "13:00 - 16:00"}


def sanitize_str(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#x27;")
        .strip()
    )


# API บันทึกข้อมูลใบนัด (POST) พร้อม validate + sanitize ฝั่ง Backend
@app.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(
    payload: AppointmentCreate, db: Session = Depends(get_db)
):
    patient_name = sanitize_str(payload.patient_name)
    if not patient_name or len(patient_name) > 100:
        raise HTTPException(
            status_code=400, detail="ชื่อผู้รับบริการต้องมีความยาว 1-100 ตัวอักษร"
        )

    phone_number = re.sub(r"[\s-]", "", payload.phone_number)
    if not re.fullmatch(r"\d{9,10}", phone_number):
        raise HTTPException(
            status_code=400, detail="เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก"
        )

    license_plate = sanitize_str(payload.license_plate)
    if len(license_plate) > 20:
        raise HTTPException(
            status_code=400, detail="ทะเบียนรถต้องไม่เกิน 20 ตัวอักษร"
        )

    if payload.appointment_date < date.today():
        raise HTTPException(
            status_code=400, detail="วันนัดหมายต้องไม่เป็นวันในอดีต"
        )

    if payload.time_slot not in ALLOWED_TIME_SLOTS:
        raise HTTPException(
            status_code=400,
            detail="ช่วงเวลาต้องเป็น 09:00 - 12:00 หรือ 13:00 - 16:00",
        )

    dept = (
        db.query(HospitalDept)
        .filter(HospitalDept.dept_id == payload.dept_id)
        .first()
    )
    if not dept:
        raise HTTPException(status_code=400, detail="ไม่พบแผนกที่นัดหมาย")

    qr_token = f"QR-{secrets.token_hex(12).upper()}"      # Token สุ่มจาก os random ไม่ซ้ำและเดายาก

    new_item = Appointment(
        qr_token=qr_token,
        patient_name=patient_name,
        phone_number=phone_number,
        license_plate=license_plate,
        dept_id=payload.dept_id,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        location_id=1,  # ชั้นจอดรถเริ่มต้นตึก PremiumClinic
    )
    db.add(new_item)
    try:
        db.commit()
        db.refresh(new_item)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถบันทึกข้อมูลได้")

    return AppointmentResponse(
        appointment_id=new_item.appointment_id,
        patient_name=new_item.patient_name,
        phone_number=new_item.phone_number,
        license_plate=new_item.license_plate,
        dept_id=new_item.dept_id,
        department=dept.dept_name_th,
        status=new_item.status,
        created_at=new_item.created_at,
    )




# ==========================================
# 1. API ดึงรายชื่อแผนกทั้งหมด
# ==========================================
@app.get("/api/departments")
def get_departments(db: Session = Depends(get_db)):
    try:
        depts = db.query(HospitalDept).all()
    except Exception:
        raise HTTPException(status_code=500, detail="ไม่สามารถดึงข้อมูลแผนกได้")

    return [
        {
            "dept_id": d.dept_id,
            "dept_code": d.dept_code,
            "dept_name_th": d.dept_name_th,
            "dept_name_en": d.dept_name_en,
        }
        for d in depts
    ]

# ==========================================
# 2. API ลบรายการ (Soft Delete เปลี่ยนสถานะเป็น cancelled)
# ==========================================
@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(Appointment)
        .filter(Appointment.appointment_id == appointment_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=404, detail="ไม่พบรายการนัดหมายที่ต้องการลบ"
        )

    # เปลี่ยนสถานะเพื่อเก็บไว้ดูประวัติ
    item.status = "cancelled"
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถอัปเดตข้อมูลได้")
    return {
        "status": "success",
        "message": "ย้ายรายการไปที่หน้าประวัติเรียบร้อยแล้ว",
    }


# ==========================================
# 3. API กู้คืนข้อมูล (Restore ปรับสถานะเป็น backup)
# ==========================================
@app.put("/api/appointments/{appointment_id}/restore")
def restore_appointment(appointment_id: int, db: Session = Depends(get_db)):
    item = (
        db.query(Appointment)
        .filter(Appointment.appointment_id == appointment_id)
        .first()
    )
    if not item:
        raise HTTPException(
            status_code=404, detail="ไม่พบรายการนัดหมายที่ต้องการกู้คืน"
        )

    # เปลี่ยนสถานะเป็น backup ตามที่ต้องการ
    item.status = "backup"
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="ไม่สามารถอัปเดตข้อมูลได้")
    return {
        "status": "success",
        "message": "กู้คืนรายการเป็นสถานะ backup สำเร็จ",
    }