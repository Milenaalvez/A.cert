-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "uf" TEXT NOT NULL DEFAULT '',
    "email_confirmed" INTEGER NOT NULL DEFAULT 0,
    "confirmation_token" TEXT,
    "reset_token" TEXT,
    "reset_token_expires" TEXT,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "department_id" TEXT,
    "position_id" TEXT,
    "contract_type" TEXT NOT NULL DEFAULT 'CLT',
    "weekly_hours" INTEGER NOT NULL DEFAULT 40,
    "work_schedule" TEXT NOT NULL DEFAULT 'Seg-Sex',
    "hire_date" TEXT,
    "is_active" INTEGER NOT NULL DEFAULT 1,
    "email_verified" INTEGER NOT NULL DEFAULT 0,
    "last_access_at" TEXT,
    "company_id" TEXT,
    "avatar" TEXT,
    "registration_number" TEXT,
    "employee_code" TEXT,
    "birth_date" TEXT,
    "city" TEXT,
    "address" TEXT,
    "password_change_required" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "cnpj" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "cell_phone" TEXT,
    "rg" TEXT,
    "birth_date" TEXT,
    "mother_name" TEXT,
    "father_name" TEXT,
    "marital_status" TEXT NOT NULL DEFAULT '',
    "nationality" TEXT NOT NULL DEFAULT 'Brasileiro(a)',
    "zip_code" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "observation" TEXT,
    "is_pre_cadastro" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TEXT,
    "deleted_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "registration" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'Apartamento',
    "address" TEXT NOT NULL,
    "owner_id" TEXT,
    "notary_office" TEXT NOT NULL DEFAULT '',
    "cartorio" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Regular',
    "neighborhood" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip_code" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL DEFAULT '',
    "land_area" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "deleted_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',
    "updated_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "person_id" TEXT,
    "property_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Em andamento',
    "priority" TEXT NOT NULL DEFAULT 'Regular',
    "created_by" TEXT,
    "observation" TEXT NOT NULL DEFAULT '',
    "transaction_type" TEXT NOT NULL DEFAULT 'venda',
    "archived_at" TEXT,
    "deleted_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',
    "updated_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "dossier_id" TEXT,
    "person_id" TEXT,
    "name" TEXT NOT NULL,
    "organ" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "protocol" TEXT,
    "obtained_at" TEXT,
    "document_path" TEXT,
    "cert_type" TEXT NOT NULL DEFAULT '',
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_participants" (
    "dossier_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'proprietario',

    CONSTRAINT "dossier_participants_pkey" PRIMARY KEY ("dossier_id","person_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "logo_url" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "license_status" TEXT NOT NULL DEFAULT 'active',
    "license_expires_at" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "company_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("company_id","key")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department_id" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "justifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rh_response" TEXT,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "justifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "date" TEXT NOT NULL,
    "clock_in" TEXT,
    "clock_out" TEXT,
    "break_start" TEXT,
    "break_end" TEXT,
    "total_minutes" INTEGER,
    "review_status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "time_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("user_id","permission")
);

-- CreateTable
CREATE TABLE "team_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "target_user_id" TEXT,
    "target_user_name" TEXT,
    "timestamp" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "team_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_owners" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "participation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "property_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_timeline" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "property_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_relationships" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "related_person_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL DEFAULT 'parental',
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "person_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reference" TEXT,
    "dossier_ref" TEXT,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'online',
    "last_sync" TEXT,
    "avg_response_time" TEXT NOT NULL DEFAULT '—',
    "last_query" TEXT,
    "token_expiry" TEXT,
    "token_updated_at" TEXT,
    "updated_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "organs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'pessoal',
    "site_url" TEXT NOT NULL DEFAULT '',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "requires_orgao" TEXT NOT NULL DEFAULT '',
    "requires_cartorio" INTEGER NOT NULL DEFAULT 0,
    "requires_inscricao" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'pessoa_fisica',
    "interval_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "certificate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Problema técnico',
    "message" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberto',
    "created_at" TEXT NOT NULL DEFAULT '',
    "updated_at" TEXT,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "detail" TEXT,
    "ip_address" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT 'success',
    "created_at" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "persons_cpf_key" ON "persons"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_identifier_key" ON "dossiers"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "property_owners_property_id_person_id_key" ON "property_owners"("property_id", "person_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_relationships_person_id_related_person_id_key" ON "person_relationships"("person_id", "related_person_id");

-- CreateIndex
CREATE UNIQUE INDEX "organs_name_key" ON "organs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_templates_key_key" ON "certificate_templates"("key");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_protocol_key" ON "support_tickets"("protocol");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_participants" ADD CONSTRAINT "dossier_participants_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_participants" ADD CONSTRAINT "dossier_participants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_records" ADD CONSTRAINT "time_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_activities" ADD CONSTRAINT "team_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_timeline" ADD CONSTRAINT "property_timeline_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_relationships" ADD CONSTRAINT "person_relationships_related_person_id_fkey" FOREIGN KEY ("related_person_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_dossier_ref_fkey" FOREIGN KEY ("dossier_ref") REFERENCES "dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
