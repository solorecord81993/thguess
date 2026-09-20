# THGUESS

เกมทายสถานที่ในประเทศไทยบนเว็บ — Explore, Guess, Compete.

## MVP
- Responsive game UI สำหรับมือถือและ desktop
- Google Street View 360° แบบโต้ตอบได้ โดยผู้เล่นไม่ต้องกรอก API key
- เกมทายสถานที่ 5 รอบ พร้อมจับเวลาและหน้าสรุปผล
- Interactive Thailand map + distance scoring
- Local player profile / stats
- คะแนนสูงสุดบนอุปกรณ์
- โหมดทั่วประเทศไทย / Bangkok / Speed Run / Daily Challenge

## Online leaderboard

อันดับออนไลน์ใช้ Upstash Redis ผ่าน Vercel Functions โดยระบบตรวจคะแนนแต่ละรอบใหม่บนเซิร์ฟเวอร์ก่อนบันทึก

1. เปิดโปรเจกต์ `thguess` ใน Vercel
2. ไปที่ Storage หรือ Marketplace แล้วติดตั้ง Upstash Redis
3. เชื่อม Redis database เข้ากับโปรเจกต์ `thguess` ทุก environment
4. ตรวจว่ามี `KV_REST_API_URL` และ `KV_REST_API_TOKEN` (หรือชื่อเดิม
   `UPSTASH_REDIS_REST_URL` และ `UPSTASH_REDIS_REST_TOKEN`)
5. Redeploy production หนึ่งครั้งหลังเชื่อม integration

ห้ามนำ `KV_REST_API_TOKEN` หรือ `UPSTASH_REDIS_REST_TOKEN` ไปใส่ในโค้ดฝั่ง
browser หรือ commit ลง Git

## Deployment
Production: https://thguess.vercel.app

Next: cloud authentication/database and online leaderboard.
