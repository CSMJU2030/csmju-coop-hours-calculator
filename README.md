# csmju-coop-hours-calculator

Co-op Hours Calculator — ระบบย่อยของโครงการ CSMJU2030

มาตรฐานกลางอยู่ใน `standards/` (submodule ของ CSMJU2030/csmju2030-standards)
สร้างจาก standards v1.0.0

## เริ่มทำงาน

```bash
git submodule update --init --remote standards/
pnpm install
git checkout -b feature/coop-hours-calculator/<เรื่องที่ทำ>
```

ก่อนเปิด PR อ่าน `standards/docs/github-workflow.md` ข้อ 1

> หมายเหตุ: ก่อนรันในเครื่อง ให้สร้างไฟล์ `.env` ของ backend และ `.env.local` ของ frontend เอง (ห้าม commit) ดูตัวอย่างใน `.env.example`

> รันบนเครื่อง: `pnpm --filter backend start:dev` (พอร์ต 4000) และ `pnpm --filter frontend dev` (พอร์ต 3013)
