-- CreateEnum
CREATE TYPE "core_role" AS ENUM ('student', 'alumni', 'staff', 'admin');

-- CreateEnum
CREATE TYPE "activity_status" AS ENUM ('OPEN', 'PUBLISHED', 'CLOSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "hour_request_category" AS ENUM ('COOP', 'VOLUNTEER', 'MAJOR');

-- CreateEnum
CREATE TYPE "hour_request_status" AS ENUM ('PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('REGISTERED', 'WAITING', 'ATTENDED', 'ABSENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "core_role" "core_role" NOT NULL DEFAULT 'student',
    "email" TEXT,
    "student_code" TEXT,
    "full_name" TEXT,
    "display_name" TEXT,
    "faculty" TEXT DEFAULT 'วิทยาศาสตร์',
    "major" TEXT,
    "year_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "activity_type" TEXT NOT NULL DEFAULT 'GENERAL',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_open" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_close" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registration_deadline" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lecturer_in_charge" TEXT NOT NULL DEFAULT '',
    "coop_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volunteer_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "major_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "activity_status" NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hour_requests" (
    "id" UUID NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "activity_id" UUID,
    "student_code" TEXT,
    "student_name" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "category" "hour_request_category" NOT NULL DEFAULT 'COOP',
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proof_url" TEXT,
    "student_photo" TEXT,
    "description" TEXT,
    "status" "hour_request_status" NOT NULL DEFAULT 'PENDING',
    "status_text" TEXT,
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "date_str" TEXT,
    "time_str" TEXT,
    "type" TEXT DEFAULT 'กิจกรรมภายนอก',
    "type_category" TEXT DEFAULT 'ภายนอก',
    "approved_hours" DOUBLE PRECISION,
    "approved_category" TEXT,
    "image_proof" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hour_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "status" "registration_status" NOT NULL DEFAULT 'REGISTERED',
    "queue_number" INTEGER,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "credited_coop_hours" DOUBLE PRECISION,
    "credited_volunteer_hours" DOUBLE PRECISION,
    "credited_major_hours" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" UUID NOT NULL,
    "activity_id" UUID NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_hour_summaries" (
    "id" UUID NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "coop_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volunteer_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "major_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_hour_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_core_user_id_key" ON "user_profiles"("core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_student_code_key" ON "user_profiles"("student_code");

-- CreateIndex
CREATE INDEX "user_profiles_core_role_idx" ON "user_profiles"("core_role");

-- CreateIndex
CREATE INDEX "activities_start_time_idx" ON "activities"("start_time");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "hour_requests_status_idx" ON "hour_requests"("status");

-- CreateIndex
CREATE INDEX "hour_requests_core_user_id_idx" ON "hour_requests"("core_user_id");

-- CreateIndex
CREATE INDEX "hour_requests_activity_id_idx" ON "hour_requests"("activity_id");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_activity_id_queue_number_key" ON "registrations"("activity_id", "queue_number");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_activity_id_core_user_id_key" ON "registrations"("activity_id", "core_user_id");

-- CreateIndex
CREATE INDEX "participations_core_user_id_idx" ON "participations"("core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "participations_activity_id_core_user_id_key" ON "participations"("activity_id", "core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_hour_summaries_core_user_id_key" ON "user_hour_summaries"("core_user_id");

-- AddForeignKey
ALTER TABLE "hour_requests" ADD CONSTRAINT "hour_requests_core_user_id_fkey" FOREIGN KEY ("core_user_id") REFERENCES "user_profiles"("core_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hour_requests" ADD CONSTRAINT "hour_requests_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_core_user_id_fkey" FOREIGN KEY ("core_user_id") REFERENCES "user_profiles"("core_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_core_user_id_fkey" FOREIGN KEY ("core_user_id") REFERENCES "user_profiles"("core_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hour_summaries" ADD CONSTRAINT "user_hour_summaries_core_user_id_fkey" FOREIGN KEY ("core_user_id") REFERENCES "user_profiles"("core_user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
