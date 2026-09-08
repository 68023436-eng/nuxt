#!/usr/bin/env bash
# ============================================================
# Cron script ลบข้อมูลที่หมดอายุจากระบบลบแบบเก็บ 1 เดือน
#
# วิธีใช้งาน:
#   1) ตั้ง CRON_SECRET ใน .env ให้ตรงกับค่าใน runtimeConfig
#   2) เพิ่ม crontab e.g. เรียกทุกเที่ยงคืน:
#       0 0 * * * /bin/bash /path/to/my_nuxt_projct/scripts/purge_cron.sh >> /path/to/my_nuxt_projct/logs/purge.log 2>&1
#   3) เปลี่ยน BASE_URL และ CRON_SECRET ด้านล่างตามสภาพแวดล้อมที่ใช้งาน
# ============================================================
set -euo pipefail

BASE_URL="${PURGE_BASE_URL:-http://localhost:3000}"
# ต้องตั้งค่าให้ตรงกับ CRON_SECRET ใน .env (ไม่มีค่า default — ถ้าไม่ตั้ง script จะ fail ทันที)
CRON_SECRET="${PURGE_CRON_SECRET:?ต้องตั้ง PURGE_CRON_SECRET หรือ CRON_SECRET ให้ตรงกับ .env}"

echo "[purge $(date '+%Y-%m-%d %H:%M:%S')] เริ่มล้างข้อมูลที่หมดอายุ..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "${BASE_URL}/api/cron/purge" \
  -H "x-cron-secret: ${CRON_SECRET}")
echo "[purge] ${RESPONSE}"