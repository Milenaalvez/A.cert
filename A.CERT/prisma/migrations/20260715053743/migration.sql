ALTER TABLE dossier_documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dossier_documents ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE dossier_documents ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
