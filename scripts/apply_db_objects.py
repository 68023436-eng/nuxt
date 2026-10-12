"""
Apply DB objects (trigger / function / stored procedure) to the database.

Run:  .venv/bin/python scripts/apply_db_objects.py

ไฟล์ทุกตัวเป็น idempotent (รันซ้ำได้เรื่อยๆ) — สร้าง/แทนที่ trigger, function,
stored procedure และ DDL wrapper (ensure_*) ให้เหมือนเดิมโดยไม่กระทบข้อมูล
"""
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent
load_dotenv(BASE.parent / ".env")

FILES = [
    "add_scan_history_table.sql",      # ตาราง + log_scan_attempt (function)
    "add_deleted_at_column.sql",       # คอลัมน์ + soft-delete trigger
    "setup_appointment_actions.sql",   # set_appointment_cancelled / restore_appointments (function)
    "ensure_purge_function.sql",       # purge_expired_appointments (function)
    "add_user_roles.sql",              # roles column + backfill_user_roles (procedure)
    "add_hospital_user_columns.sql",   # ensure_hospital_user_columns (procedure)
    "add_patient_account_columns.sql", # ensure_patient_account_columns (procedure)
    "remove_license_plate.sql",        # ensure_license_plate_nullable (procedure)
]


def main():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL not set")

    kwargs = {}
    if "sslmode" not in dsn:
        kwargs["sslmode"] = "require"

    conn = psycopg2.connect(dsn, **kwargs)
    try:
        for name in FILES:
            sql = (BASE / name).read_text(encoding="utf-8").strip()
            if not sql:
                continue
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                conn.commit()
                print(f"OK   {name}")
            except Exception as exc:
                conn.rollback()
                print(f"FAIL {name}: {exc}")
                raise
        print("Apply DB objects เรียบร้อย")
    finally:
        conn.close()


if __name__ == "__main__":
    main()