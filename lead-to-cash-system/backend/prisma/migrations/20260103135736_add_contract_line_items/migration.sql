-- CreateTable
CREATE TABLE "contract_line_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contract_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL NOT NULL DEFAULT 1,
    "unit_price" DECIMAL NOT NULL,
    "tax_rate" DECIMAL NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "tax_amount" DECIMAL NOT NULL,
    "total_amount" DECIMAL NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contract_line_items_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
