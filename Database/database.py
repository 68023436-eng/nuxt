import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# โหลดค่าจากไฟล์ .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# สร้าง Engine เชื่อมต่อไปยัง Supabase PostgreSQL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ฟังก์ชันสำหรับเรียกใช้ DB Session ใน FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()