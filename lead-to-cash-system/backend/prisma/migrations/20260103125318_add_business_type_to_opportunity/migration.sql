/*
  Warnings:

  - A unique constraint covering the columns `[opportunity_number]` on the table `opportunities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contract_number` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN "city" TEXT;
ALTER TABLE "customers" ADD COLUMN "country" TEXT;

-- AlterTable
ALTER TABLE "milestones" ADD COLUMN "acceptance_date" DATETIME;
ALTER TABLE "milestones" ADD COLUMN "acceptance_note" TEXT;
ALTER TABLE "milestones" ADD COLUMN "invoice_date" DATETIME;
ALTER TABLE "milestones" ADD COLUMN "payment_date" DATETIME;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN "business_type" TEXT;
ALTER TABLE "opportunities" ADD COLUMN "opportunity_number" TEXT;

-- CreateTable
CREATE TABLE "contract_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "contract_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procurement_number" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "commercial_owner" TEXT,
    "technical_owner" TEXT,
    "customer_budget" DECIMAL,
    "our_quote" DECIMAL,
    "submission_deadline" DATETIME,
    "notification_date" DATETIME,
    "bid_location" TEXT,
    "deposit_amount" DECIMAL,
    "notes" TEXT,
    "result_note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "procurements_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bidding_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procurement_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "assignee" TEXT,
    "document_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bidding_tasks_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "procurements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "procurement_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procurement_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "procurement_documents_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "procurements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "procurement_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES',
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Initialization',
    "budget" DECIMAL DEFAULT 0,
    "target_profit_margin" DECIMAL,
    "labor_cost" DECIMAL DEFAULT 0,
    "outsource_cost" DECIMAL DEFAULT 0,
    "travel_cost" DECIMAL DEFAULT 0,
    "emergency_support_cost" DECIMAL DEFAULT 0,
    "third_party_equipment_cost" DECIMAL DEFAULT 0,
    "software_cost" DECIMAL DEFAULT 0,
    "other_weight" DECIMAL DEFAULT 0,
    "complexity" TEXT NOT NULL DEFAULT 'Low',
    "financial_remarks" TEXT,
    "is_delayed" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "allocation_pct" INTEGER NOT NULL DEFAULT 100,
    "start_date" DATETIME,
    "end_date" DATETIME,
    CONSTRAINT "project_resources_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Weekly',
    "plan_date" DATETIME NOT NULL,
    "actual_date" DATETIME,
    "minutes" TEXT,
    "filepath" TEXT,
    "filename" TEXT,
    "mimetype" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_meetings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_risks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL DEFAULT 'Medium',
    "status" TEXT NOT NULL DEFAULT 'Open',
    "mitigation_plan" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "project_risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "project_id" TEXT,
    "milestone_id" TEXT,
    "invoice_date" DATETIME NOT NULL,
    "due_date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "tax_rate" REAL NOT NULL,
    "tax_amount" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "currency" TEXT NOT NULL DEFAULT 'RMB',
    "exchange_rate" REAL,
    "description" TEXT,
    "remarks" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payment_number" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "payment_date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RMB',
    "payment_method" TEXT NOT NULL,
    "bank_name" TEXT,
    "transaction_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Confirmed',
    "remarks" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "milestone_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "milestones" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "fund_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "principalAmount" DECIMAL NOT NULL DEFAULT 0,
    "expectedDuration" INTEGER,
    "costRuleType" TEXT,
    "costRate" DECIMAL,
    "passThreshold" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "fund_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "capital_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "actualDuration" INTEGER,
    "interestCost" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "capital_allocations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "fund_transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revenue_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "receivedDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_collections_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "fund_transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expense_payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "baseAmount" DECIMAL NOT NULL,
    "payoutType" TEXT NOT NULL,
    "conversionRate" DECIMAL NOT NULL,
    "netAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expense_payouts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "fund_transactions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_number" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "total_contract_value" DECIMAL NOT NULL,
    "payment_terms" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "risk_assessment" TEXT,
    "scope" TEXT,
    "sla" TEXT,
    "liability" TEXT,
    "payment_terms_details" TEXT,
    "drafter_id" TEXT,
    "approver_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contracts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contracts_drafter_id_fkey" FOREIGN KEY ("drafter_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_contracts" ("created_at", "end_date", "id", "is_active", "opportunity_id", "start_date", "total_contract_value") SELECT "created_at", "end_date", "id", "is_active", "opportunity_id", "start_date", "total_contract_value" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");
CREATE TABLE "new_follow_ups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunity_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" TEXT,
    "created_by_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_ups_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follow_ups_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_follow_ups" ("content", "created_at", "created_by", "id", "opportunity_id") SELECT "content", "created_at", "created_by", "id", "opportunity_id" FROM "follow_ups";
DROP TABLE "follow_ups";
ALTER TABLE "new_follow_ups" RENAME TO "follow_ups";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "procurements_procurement_number_key" ON "procurements"("procurement_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "projects_contract_id_key" ON "projects"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_milestone_id_key" ON "invoices"("milestone_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX "fund_transactions_projectId_idx" ON "fund_transactions"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunities_opportunity_number_key" ON "opportunities"("opportunity_number");
