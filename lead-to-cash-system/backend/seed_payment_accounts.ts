import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const accounts = [
    {
        accountName: '上海正奇信息科技有限公司',
        bankName: '中国农业银行（上海东开支行）',
        accountNumber: '03801320040061853',
        isDefault: true,
        isActive: true,
        description: '农行账户'
    },
    {
        accountName: '上海正奇信息科技有限公司',
        bankName: '招商银行上海徐家汇支行',
        accountNumber: '1219 5389 0610 001',
        isDefault: false,
        isActive: true,
        description: '招行账户'
    }
];

async function main() {
    console.log('Seeding payment accounts...');
    for (const acc of accounts) {
        // Remove spaces for duplicates check just in case, but insert as is
        const exists = await prisma.paymentAccount.findFirst({
            where: { accountNumber: acc.accountNumber }
        });

        if (!exists) {
            await prisma.paymentAccount.create({ data: acc });
            console.log(`Created: ${acc.bankName} - ${acc.accountNumber}`);
        } else {
            console.log(`Skipped (Exists): ${acc.bankName} - ${acc.accountNumber}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
