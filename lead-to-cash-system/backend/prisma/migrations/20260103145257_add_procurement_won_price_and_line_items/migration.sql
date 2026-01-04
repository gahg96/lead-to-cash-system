-- AlterTable
ALTER TABLE "procurements" ADD COLUMN "won_price" DECIMAL;

-- CreateTable
CREATE TABLE "procurement_line_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procurement_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "procurement_line_items_procurement_id_fkey" FOREIGN KEY ("procurement_id") REFERENCES "procurements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
