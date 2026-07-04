-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device" TEXT NOT NULL DEFAULT '',
    "browser" TEXT NOT NULL DEFAULT '',
    "os" TEXT NOT NULL DEFAULT '',
    "ip_address" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT '',
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
