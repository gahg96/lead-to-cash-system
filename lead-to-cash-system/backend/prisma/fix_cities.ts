
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing Customer Citites...');

    const updates = [
        { name: '上海清算所', city: '上海市' },
        { name: '上海机场', city: '上海市' },
        { name: '国泰君安证券', city: '上海市' },
        { name: '中国外汇交易中心', city: '上海市' },
        { name: 'TechGiant Corp', city: '深圳市' },
        { name: 'Rocket Startup', city: '北京市' },
    ];

    for (const u of updates) {
        const customer = await prisma.customer.findFirst({
            where: { companyName: { contains: u.name } }
        });

        if (customer) {
            await prisma.customer.update({
                where: { id: customer.id },
                data: { city: u.city }
            });
            console.log(`Updated ${u.name} to ${u.city}`);
        } else {
            console.log(`Customer ${u.name} not found`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
