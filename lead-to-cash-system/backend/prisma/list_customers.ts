
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const customers = await prisma.customer.findMany({
        select: { id: true, companyName: true, city: true }
    });
    console.log('All Customers:', customers);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
