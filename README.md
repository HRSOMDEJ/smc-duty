# SMC Duty — Frontend

Frontend (static HTML/CSS/JS) ของระบบบันทึกและตรวจสอบการลงเวลาปฏิบัติงาน SMC
เดิมรันเป็น HtmlService ฝัง Google Apps Script ทั้งหมด — ตอนนี้แยกมาโฮสต์บน GitHub Pages
โดยเรียกข้อมูลจาก backend (Google Apps Script Web App) ผ่าน `fetch()`

## ตั้งค่าก่อนใช้งาน

แก้ `js/config.js` ให้ `API_URL` เป็น URL ของ Web App ที่ deploy จากโฟลเดอร์ `backend/` (ลงท้ายด้วย `/exec`)

```js
var API_URL = 'https://script.google.com/macros/s/XXXXX.../exec';
```

ดูขั้นตอนตั้งค่า backend แบบละเอียดได้ที่ `migrate_instruction.md` ในโปรเจกต์หลัก

## Deploy

Push เข้า branch `main` แล้ว GitHub Actions (`.github/workflows/deploy.yml`) จะ deploy ขึ้น GitHub Pages ให้อัตโนมัติ
(ต้องเปิด Settings → Pages → Source = GitHub Actions ในการตั้งค่าครั้งแรก)
