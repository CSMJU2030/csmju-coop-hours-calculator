# ---------- build stage ----------
# build context คือ "รากของ repo" เพราะ pnpm workspace เก็บ lockfile ไว้ที่ราก
#   docker build -f backend/Dockerfile .
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

# `prisma generate` (postinstall) โหลด prisma.config.ts ซึ่งต้องมี DATABASE_URL
# การ generate ไม่ได้ต่อฐานข้อมูล ค่านี้จึงเป็นแค่ placeholder ตอน build
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build_only

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter backend...

COPY backend/ backend/
RUN pnpm --filter backend exec prisma generate \
 && pnpm --filter backend build

# ---------- runtime stage ----------
FROM node:22-alpine AS runner

# พอร์ตใน container คือ 4000 เสมอ (deployment.md ข้อ 3.1) — ค่าอื่นของระบบมาจาก env ตอนรัน ไม่ใส่ secret ที่นี่
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000
RUN corepack enable pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
# ห้ามใส่ --ignore-scripts: @prisma/engines ต้องดาวน์โหลด engine ที่ prisma migrate deploy ใช้ตอนสตาร์ต
# ลบ store/cache ของ pnpm ใน RUN เดียวกัน ไม่งั้นติดอยู่ใน image อีกหลายร้อย MB
RUN pnpm install --frozen-lockfile --prod --filter backend... \
 && pnpm store prune \
 && rm -rf /root/.cache /root/.local/share/pnpm

# dist/ มีทั้งโค้ดที่ compile แล้ว (dist/src) และ Prisma client (dist/generated/prisma)
# ห้าม chown -R ทั้งโฟลเดอร์แอป (image โตเท่าตัว) — user node อ่านไฟล์ของ root ได้อยู่แล้ว
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
COPY --chmod=755 backend/docker/entrypoint.sh ./backend/docker/entrypoint.sh

# DEP-02: stage สุดท้ายต้องไม่รันเป็น root
USER node
WORKDIR /app/backend

EXPOSE 4000

ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
