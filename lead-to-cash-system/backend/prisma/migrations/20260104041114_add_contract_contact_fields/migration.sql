-- AlterTable
ALTER TABLE "contracts" ADD COLUMN "customer_contact_email" TEXT;
ALTER TABLE "contracts" ADD COLUMN "customer_contact_name" TEXT;
ALTER TABLE "contracts" ADD COLUMN "customer_contact_phone" TEXT;
ALTER TABLE "contracts" ADD COLUMN "customer_contact_title" TEXT;
ALTER TABLE "contracts" ADD COLUMN "estimated_value" DECIMAL;
ALTER TABLE "contracts" ADD COLUMN "vendor_contact_name" TEXT;
ALTER TABLE "contracts" ADD COLUMN "vendor_contact_phone" TEXT;
ALTER TABLE "contracts" ADD COLUMN "vendor_name" TEXT;
ALTER TABLE "contracts" ADD COLUMN "won_price" DECIMAL;

-- AlterTable
ALTER TABLE "procurements" ADD COLUMN "agency_fee" DECIMAL;
ALTER TABLE "procurements" ADD COLUMN "printing_fee" DECIMAL;
ALTER TABLE "procurements" ADD COLUMN "tender_fee" DECIMAL;

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "industry" TEXT,
    "region" TEXT,
    "brand" TEXT,
    "parent_id" TEXT,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vendors_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CustomerToVendor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CustomerToVendor_A_fkey" FOREIGN KEY ("A") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CustomerToVendor_B_fkey" FOREIGN KEY ("B") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_OpportunityToVendor" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_OpportunityToVendor_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OpportunityToVendor_B_fkey" FOREIGN KEY ("B") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerToVendor_AB_unique" ON "_CustomerToVendor"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerToVendor_B_index" ON "_CustomerToVendor"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OpportunityToVendor_AB_unique" ON "_OpportunityToVendor"("A", "B");

-- CreateIndex
CREATE INDEX "_OpportunityToVendor_B_index" ON "_OpportunityToVendor"("B");
