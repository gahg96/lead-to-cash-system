
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing Customer Citites (Round 2)...');

    const updates = [
        { name: '中国工商银行', city: '北京市' },
        { name: '中国移动', city: '北京市' },
        { name: '中国太平', city: '北京市' },
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
