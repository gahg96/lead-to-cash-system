import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vendors = [
    // WPS (金山办公)
    { name: '金山办公 (上海国企)', brand: 'WPS', region: '上海', industry: '国企', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
    { name: '金山办公 (金融)', brand: 'WPS', region: '全国', industry: '金融', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
    { name: '金山办公 (党政销售)', brand: 'WPS', region: '全国', industry: '党政', type: '软件厂商', contactName: '待补充', contactPhone: '-' },

    // 东方通
    { name: '东方通 (华东)', brand: '东方通', region: '华东', industry: '通用', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
    { name: '东方通 (华南)', brand: '东方通', region: '华南', industry: '通用', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
    { name: '东方通 (闽浙)', brand: '东方通', region: '闽浙', industry: '通用', type: '软件厂商', contactName: '待补充', contactPhone: '-' },

    // UOS (统信软件)
    { name: '统信软件 (上海金融)', brand: 'UOS', region: '上海', industry: '金融', type: '软件厂商', contactName: '待补充', contactPhone: '-' },

    // 达梦
    { name: '达梦数据库 (福建全行业)', brand: '达梦', region: '福建', industry: '全行业', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
    { name: '达梦数据库 (上海金融)', brand: '达梦', region: '上海', industry: '金融', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
    { name: '达梦数据库 (教育)', brand: '达梦', region: '全国', industry: '教育', type: '软件厂商', contactName: '待补充', contactPhone: '-' },
];

async function main() {
    console.log('Seeding vendors...');
    for (const v of vendors) {
        const exists = await prisma.vendor.findFirst({
            where: { name: v.name }
        });
        if (!exists) {
            await prisma.vendor.create({ data: v });
            console.log(`Created: ${v.name}`);
        } else {
            console.log(`Skipped (Exists): ${v.name}`);
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
