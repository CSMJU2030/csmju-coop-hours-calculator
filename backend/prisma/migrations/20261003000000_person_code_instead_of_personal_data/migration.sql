-- reference-data.md ข้อ 8: ระบบย่อยเก็บได้แค่ core_user_id + person_code
-- ชื่อ อีเมล คณะ สาขา ชั้นปี เป็นข้อมูลของ Core Hub — ดูตอนแสดงผลด้วย token ของผู้ดู

-- user_profiles: เปลี่ยน student_code เป็น person_code แล้วลบข้อมูลบุคคลอื่น
DROP INDEX "user_profiles_student_code_key";
ALTER TABLE "user_profiles" RENAME COLUMN "student_code" TO "person_code";
-- ค่าเดิมเป็น "username เดิมก่อนย้ายมาตรฐาน" ไม่ใช่ personCode ของ Core Hub จึงล้างทิ้ง
-- ระบบจะดึงค่าจริงจาก GET /people/me ตอนผู้ใช้เข้าระบบครั้งถัดไป
UPDATE "user_profiles" SET "person_code" = NULL;
ALTER TABLE "user_profiles"
  DROP COLUMN "email",
  DROP COLUMN "full_name",
  DROP COLUMN "display_name",
  DROP COLUMN "faculty",
  DROP COLUMN "major",
  DROP COLUMN "year_level";
CREATE INDEX "user_profiles_person_code_idx" ON "user_profiles"("person_code");

-- hour_requests: เก็บรหัสไว้เป็นประวัติ ณ ตอนยื่น แต่ไม่เก็บชื่อ
ALTER TABLE "hour_requests" RENAME COLUMN "student_code" TO "person_code";
ALTER TABLE "hour_requests" DROP COLUMN "student_name";
CREATE INDEX "hour_requests_person_code_idx" ON "hour_requests"("person_code");
