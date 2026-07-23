-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_logs_userId_idx" ON "login_logs"("userId");

-- CreateIndex
CREATE INDEX "login_logs_createdAt_idx" ON "login_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "login_logs" ADD CONSTRAINT "login_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
