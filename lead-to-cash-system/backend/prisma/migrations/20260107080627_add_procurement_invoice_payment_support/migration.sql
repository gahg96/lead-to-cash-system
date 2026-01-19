-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_invoices" (
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
    "direction" TEXT NOT NULL DEFAULT 'OUTGOING',
    "vendor_invoice_number" TEXT,
    "received_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_invoices" ("amount", "contract_id", "created_at", "currency", "description", "due_date", "exchange_rate", "file_name", "file_path", "id", "invoice_date", "invoice_number", "milestone_id", "project_id", "remarks", "status", "tax_amount", "tax_rate", "total_amount", "type", "updated_at") SELECT "amount", "contract_id", "created_at", "currency", "description", "due_date", "exchange_rate", "file_name", "file_path", "id", "invoice_date", "invoice_number", "milestone_id", "project_id", "remarks", "status", "tax_amount", "tax_rate", "total_amount", "type", "updated_at" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE UNIQUE INDEX "invoices_milestone_id_key" ON "invoices"("milestone_id");
CREATE TABLE "new_payments" (
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
    "paymentType" TEXT NOT NULL DEFAULT 'RECEIPT',
    "from_account" TEXT,
    "to_account" TEXT,
    "file_path" TEXT,
    "file_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payments" ("amount", "bank_name", "created_at", "currency", "file_name", "file_path", "id", "invoice_id", "payment_date", "payment_method", "payment_number", "remarks", "status", "transaction_ref", "updated_at") SELECT "amount", "bank_name", "created_at", "currency", "file_name", "file_path", "id", "invoice_id", "payment_date", "payment_method", "payment_number", "remarks", "status", "transaction_ref", "updated_at" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
CREATE UNIQUE INDEX "payments_payment_number_key" ON "payments"("payment_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
