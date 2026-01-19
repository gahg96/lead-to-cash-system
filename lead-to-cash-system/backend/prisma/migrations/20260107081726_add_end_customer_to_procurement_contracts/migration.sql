-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_number" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL DEFAULT 'SALES',
    "opportunity_id" TEXT,
    "vendor_id" TEXT,
    "procurement_category" TEXT,
    "related_sales_contract_id" TEXT,
    "end_customer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "total_contract_value" DECIMAL NOT NULL,
    "payment_terms" TEXT,
    "won_price" DECIMAL,
    "estimated_value" DECIMAL,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "customer_contact_name" TEXT,
    "customer_contact_phone" TEXT,
    "customer_contact_email" TEXT,
    "customer_contact_title" TEXT,
    "vendor_name" TEXT,
    "vendor_contact_name" TEXT,
    "vendor_contact_phone" TEXT,
    "risk_assessment" TEXT,
    "scope" TEXT,
    "sla" TEXT,
    "liability" TEXT,
    "payment_terms_details" TEXT,
    "payment_account" TEXT,
    "bank_name" TEXT,
    "account_name" TEXT,
    "penalties" TEXT,
    "warranty" TEXT,
    "confidentiality" TEXT,
    "dispute_resolution" TEXT,
    "special_terms" TEXT,
    "drafter_id" TEXT,
    "approver_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contracts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_related_sales_contract_id_fkey" FOREIGN KEY ("related_sales_contract_id") REFERENCES "contracts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_end_customer_id_fkey" FOREIGN KEY ("end_customer_id") REFERENCES "customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_drafter_id_fkey" FOREIGN KEY ("drafter_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_contracts" ("account_name", "approver_id", "bank_name", "confidentiality", "contract_number", "contract_type", "created_at", "customer_contact_email", "customer_contact_name", "customer_contact_phone", "customer_contact_title", "dispute_resolution", "drafter_id", "end_date", "estimated_value", "id", "is_active", "liability", "opportunity_id", "payment_account", "payment_terms", "payment_terms_details", "penalties", "procurement_category", "related_sales_contract_id", "risk_assessment", "scope", "sla", "special_terms", "start_date", "status", "total_contract_value", "vendor_contact_name", "vendor_contact_phone", "vendor_id", "vendor_name", "warranty", "won_price") SELECT "account_name", "approver_id", "bank_name", "confidentiality", "contract_number", "contract_type", "created_at", "customer_contact_email", "customer_contact_name", "customer_contact_phone", "customer_contact_title", "dispute_resolution", "drafter_id", "end_date", "estimated_value", "id", "is_active", "liability", "opportunity_id", "payment_account", "payment_terms", "payment_terms_details", "penalties", "procurement_category", "related_sales_contract_id", "risk_assessment", "scope", "sla", "special_terms", "start_date", "status", "total_contract_value", "vendor_contact_name", "vendor_contact_phone", "vendor_id", "vendor_name", "warranty", "won_price" FROM "contracts";
DROP TABLE "contracts";
ALTER TABLE "new_contracts" RENAME TO "contracts";
CREATE UNIQUE INDEX "contracts_contract_number_key" ON "contracts"("contract_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
