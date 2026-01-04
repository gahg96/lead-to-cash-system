
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany({
        include: {
            opportunities: true
        }
    });
    console.log('Customer Opportunity Check:');
    console.log('-------------------');
    customers.forEach(c => {
        console.log(`Customer: ${c.companyName} (${c.city})`);
        c.opportunities.forEach(o => {
            console.log(`  - Opp Title: ${o.title}`);
            console.log(`  - Status: ${o.status}`);
            console.log(`  - Value: ${o.estimatedValue}`);
        });
        if (c.opportunities.length === 0) console.log('  - No opportunities');
        console.log('-------------------');
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
