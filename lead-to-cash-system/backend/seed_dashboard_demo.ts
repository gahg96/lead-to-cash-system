
import { PrismaClient, InvoiceStatus, MilestoneStatus, InvoiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Dashboard Demo Data ---');

    // 1. Update a milestone to "Verified" to show in "Pending Invoice Amount"
    // Target: [CTR-2026-6186] 项目终验
    const milestone = await prisma.milestone.findFirst({
        where: {
            contract: { contractNumber: 'CTR-2026-6186' },
            name: '项目终验'
        }
    });

    if (milestone) {
        await prisma.milestone.update({
            where: { id: milestone.id },
            data: { status: MilestoneStatus.Verified }
        });
        console.log(`Updated milestone '${milestone.name}' to Verified.`);
    } else {
        console.log('Milestone not found, skipping update.');
    }

    // 2. Create Invoices for Aging Analysis
    // Need a contract ID to attach invoices to. Using CTR-2026-6186.
    const contract = await prisma.contract.findUnique({
        where: { contractNumber: 'CTR-2026-6186' }
    });

    if (contract) {
        console.log(`Found contract: ${contract.contractNumber}`);

        // Invoice 1: Overdue (30-90 days)
        // Issued 45 days ago, Due 40 days ago
        const date1 = new Date();
        date1.setDate(date1.getDate() - 45);
        const dueDate1 = new Date();
        dueDate1.setDate(dueDate1.getDate() - 40);

        const inv1 = await prisma.invoice.create({
            data: {
                invoiceNumber: 'RM-2026-DEMO-01',
                contractId: contract.id,
                invoiceDate: date1,
                dueDate: dueDate1,
                amount: 50000,
                taxRate: 0.06,
                taxAmount: 3000,
                totalAmount: 53000,
                status: InvoiceStatus.Issued, // Outstanding
                type: InvoiceType.Service,
                description: 'Demo Invoice - Overdue'
            }
        });
        console.log(`Created Overdue Invoice: ${inv1.invoiceNumber}`);

        // Invoice 2: Not Due
        // Issued today, Due in 15 days
        const date2 = new Date();
        const dueDate2 = new Date();
        dueDate2.setDate(dueDate2.getDate() + 15);

        const inv2 = await prisma.invoice.create({
            data: {
                invoiceNumber: 'RM-2026-DEMO-02',
                contractId: contract.id,
                invoiceDate: date2,
                dueDate: dueDate2,
                amount: 20000,
                taxRate: 0.06,
                taxAmount: 1200,
                totalAmount: 21200,
                status: InvoiceStatus.Issued, // Outstanding
                type: InvoiceType.Service,
                description: 'Demo Invoice - Not Due'
            }
        });
        console.log(`Created Not Due Invoice: ${inv2.invoiceNumber}`);

    } else {
        console.log('Contract not found, skipping invoice creation.');
    }

    console.log('--- Done ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
