"""
Setup RLS policies ที่ระบบสิทธิ์เข้าถึงจำเป็นต้องใช้

วิธีรัน:  .venv/bin/python scripts/setup_access.py

สาเหตุที่ต้องรันใหม่: การเปิด/ปิดหรือ "Save" ตารางใน Supabase Dashboard
จะลบ policies ที่สร้างไว้ จนแอปไม่สามารถอ่าน/เขียนฐานข้อมูลผ่าน anon key ได้
(สังเกตจาก error RLS 42501 เช่น "new row violates row-level security policy")

รันซ้ำได้เรื่อยๆ (idempotent) — หลังรันเสร็จแอปจะทำงานปกติ
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

load_dotenv(os.path.join(os.path.dirname(__file__), os.pardir, ".env"))

#  tabe, [ (policy name, command, using, with_check) ]
#  Command: SELECT ใช้ USING, INSERT ใช้ WITH CHECK, UPDATE ใช้ USING+WITH CHECK, DELETE ใช้ USING
PLANS = {
    "hospital_user": [
        ("hospital_user_readable", "SELECT", "true", None),
    ],
    "hospital_dept": [
        ("hospital_dept_readable", "SELECT", "true", None),
    ],
    "hospital_parking": [
        ("hospital_parking_readable", "SELECT", "true", None),
    ],
    "appointments": [
        ("appointments_select", "SELECT", "true", None),
        ("appointments_insert", "INSERT", None, "true"),
        ("appointments_update", "UPDATE", "true", "true"),
        ("appointments_delete", "DELETE", "true", None),
    ],
}


def build_ddl(table: str, name: str, cmd: str, using, with_check) -> str:
    drop = f'DROP POLICY IF EXISTS {name} ON {table}'
    if cmd == "SELECT":
        return f"{drop}; CREATE POLICY {name} ON {table} FOR SELECT USING ({using});"
    if cmd == "INSERT":
        return f"{drop}; CREATE POLICY {name} ON {table} FOR INSERT WITH CHECK ({with_check});"
    if cmd == "UPDATE":
        return f"{drop}; CREATE POLICY {name} ON {table} FOR UPDATE USING ({using}) WITH CHECK ({with_check});"
    if cmd == "DELETE":
        return f"{drop}; CREATE POLICY {name} ON {table} FOR DELETE USING ({using});"
    raise ValueError(cmd)


def main():
    engine = create_engine(os.getenv("DATABASE_URL"))
    ok = True
    with engine.begin() as conn:
        for table, policies in PLANS.items():
            conn.execute(text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY"))
            for name, cmd, using, with_check in policies:
                try:
                    conn.execute(text(build_ddl(table, name, cmd, using, with_check)))
                    print(f"OK   {table}.{name} ({cmd})")
                except ProgrammingError as exc:
                    ok = False
                    print(f"FAIL {table}.{name} -> {exc}")
    print("Setup เรียบร้อย" if ok else "มีบาง policy สร้างไม่สำเร็จ ดูข้อผิดพลาดข้างบน")


if __name__ == "__main__":
    main()