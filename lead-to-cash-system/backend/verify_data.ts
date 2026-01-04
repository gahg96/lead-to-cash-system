
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        include: {
            contract: true,
            fundTransactions: true
        }
    });

    console.log('--- Projects Found: ' + projects.length + ' ---');
    projects.forEach(p => {
        console.log(`Project ID: ${p.id} (Status: ${p.status})`);
        console.log(`Description: ${p.description}`);
        console.log(`Contract: ${p.contract?.contractNumber}`);
        console.log(`Transactions: ${p.fundTransactions.length}`);
        p.fundTransactions.forEach(tx => {
            console.log(` - ${tx.type}: ${tx.totalAmount} (Date: ${tx.transactionDate}, Party: ${tx.partyName})`);
        });
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
