CREATE TABLE IF NOT EXISTS "dossier_observations" (
  "id" TEXT NOT NULL,
  "dossier_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "user_name" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "created_at" TEXT NOT NULL DEFAULT '',

  CONSTRAINT "dossier_observations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dossier_observations_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
