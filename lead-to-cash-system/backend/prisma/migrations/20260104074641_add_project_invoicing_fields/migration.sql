-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
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
    "requires_invoicing" BOOLEAN NOT NULL DEFAULT true,
    "invoicing_completed" BOOLEAN NOT NULL DEFAULT false,
    "invoicing_completed_at" DATETIME,
    "start_date" DATETIME,
    "endDate" DATETIME,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "projects_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("budget", "complexity", "contract_id", "created_at", "description", "emergency_support_cost", "endDate", "financial_remarks", "id", "is_delayed", "labor_cost", "other_weight", "outsource_cost", "software_cost", "start_date", "status", "target_profit_margin", "third_party_equipment_cost", "travel_cost", "updated_at") SELECT "budget", "complexity", "contract_id", "created_at", "description", "emergency_support_cost", "endDate", "financial_remarks", "id", "is_delayed", "labor_cost", "other_weight", "outsource_cost", "software_cost", "start_date", "status", "target_profit_margin", "third_party_equipment_cost", "travel_cost", "updated_at" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_contract_id_key" ON "projects"("contract_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
