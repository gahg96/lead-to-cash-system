
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const milestones = await prisma.milestone.findMany({
        select: {
            id: true,
            name: true,
            status: true,
            amount: true,
            contract: {
                select: {
                    contractNumber: true
                }
            }
        }
    });

    console.log('--- All Milestones ---');
    milestones.forEach(m => {
        console.log(`[${m.contract?.contractNumber}] ${m.name}: ${m.status} (¥${m.amount})`);
    });
    console.log('----------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
