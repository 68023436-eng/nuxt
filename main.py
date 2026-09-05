from datetime import date, datetime
from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID             # เพิ่มการ import UUID สำหรับ PostgreSQL
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

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("hospital_user.user_id"),
        nullable=True,
    )
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




# Schema ตัวรับข้อมูลจากฟอร์มหน้าเว็บ
class AppointmentCreate(BaseModel):
    patient_name: str
    phone_number: str
    license_plate: str
    dept_id: int  # ใช้ dept_id รับเลข
    appointment_date: date  # รับวันที่ 
    time_slot: str  # รับช่วงเวลา 
    user_id: Optional[str] = (
        None # ใส่ Optional เพื่อให้ยอมรับค่า null ได้เวลาไม่ได้ล็อกอิน
    )




# Schema สำหรับ response (แก้ปัญหา serialization ของ datetime)
class AppointmentResponse(BaseModel):
    id: int
    patient_name: str
    phone_number: str
    license_plate: str
    department: str
    created_at: Optional[datetime] = None

class hospital_dept(Base):
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
    parking_floor = Column(String)
    clinic_floor = Column(String)
    map_url = Column(String)

class HospitalUser(Base):
    __tablename__ = "hospital_user"
    user_id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    full_name = Column(String)
    role = Column(String)



 # API บันทึกข้อมูลใบนัด (POST)
@app.post("/api/appointments")
def create_appointment(
    payload: AppointmentCreate, db: Session = Depends(get_db)
):
    qr_token = f"QR-{int(datetime.now().timestamp())}"      # สุ่ม Token ทำ QR Code 

    new_item = Appointment(
        qr_token=qr_token,
        patient_name=payload.patient_name,
        phone_number=payload.phone_number,
        license_plate=payload.license_plate,
        dept_id=payload.dept_id,  # บันทึกเป็น dept_id
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        location_id=1,  # ชั้นจอดรถเริ่มต้นตึก PremiumClinic
        user_id=payload.user_id,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"status": "success", "data": new_item}




# ==========================================
# 1. API ดึงรายการใบนัดทั้งหมด (เส้นเดียวจบ ครบทุกสถานะ)
# ==========================================
@app.get("/api/appointments")
def get_appointments(db: Session = Depends(get_db)):
    # ดึงข้อมูลทั้งหมดโดยไม่ใส่ .filter สถานะ เพื่อให้หน้า appointments และ history ดึงไปใช้ร่วมกันได้
    results = (
        db.query(
            Appointment,
            hospital_dept.dept_name_th,
            HospitalParking.building_name,
        )
        .join(
            hospital_dept,
            Appointment.dept_id == hospital_dept.dept_id,
            isouter=True,
        )
        .join(
            HospitalParking,
            Appointment.location_id == HospitalParking.location_id,
            isouter=True,
        )
        .order_by(Appointment.appointment_id.desc())
        .all()
    )

    data = []
    for appt, dept_th, bldg in results:
        data.append(
            {
                "appointment_id": appt.appointment_id,
                "qr_token": appt.qr_token,
                "patient_name": appt.patient_name,
                "phone_number": appt.phone_number,
                "license_plate": appt.license_plate,
                "dept_id": appt.dept_id,
                "department_name": dept_th or "ไม่ระบุแผนก",
                "building_name": bldg or "อาคาร PremiumClinic",
                "appointment_date": str(appt.appointment_date),
                "time_slot": appt.time_slot,
                "status": appt.status,
                "created_at": appt.created_at.strftime("%d/%m/%Y %H:%M")
                if appt.created_at
                else "-",
            }
        )
    return data


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
    db.commit()
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
    db.commit()
    return {
        "status": "success",
        "message": "กู้คืนรายการเป็นสถานะ backup สำเร็จ",
    }