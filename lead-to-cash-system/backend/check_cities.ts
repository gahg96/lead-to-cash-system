
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany({
        include: {
            opportunities: true,
            vendors: true
        }
    });
    console.log('Customer Data Check:');
    console.log('-------------------');
    customers.forEach(c => {
        console.log(`ID: ${c.id}`);
        console.log(`Name: ${c.companyName}`);
        console.log(`City: "${c.city}" (Type: ${typeof c.city})`);
        console.log(`Contract Count: ${c.opportunities.length}`); // Proxy, strictly roughly
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
