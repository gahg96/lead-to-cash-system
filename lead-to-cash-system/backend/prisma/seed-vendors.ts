import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedVendors() {
    console.log('🌱 开始添加合作厂商测试数据...');

    const vendors = [
        {
            name: 'WPS Office',
            type: '软件厂商',
            industry: '办公软件',
            region: '全国',
            brand: 'WPS',
            contactName: '张经理',
            contactPhone: '021-12345678',
            description: '金山办公软件，提供WPS Office办公套件'
        },
        {
            name: 'Centerm（深圳中电华星）',
            type: '硬件厂商',
            industry: '云终端',
            region: '深圳',
            brand: 'Centerm',
            contactName: '李经理',
            contactPhone: '0755-88888888',
            description: '云终端、瘦客户机领导品牌'
        },
        {
            name: '东方通 TongTech',
            type: '软件厂商',
            industry: '中间件',
            region: '北京',
            brand: 'TongTech',
            contactName: '王经理',
            contactPhone: '010-66666666',
            description: '中间件产品及解决方案提供商'
        },
        {
            name: '统信软件（UnionTech）',
            type: '软件厂商',
            industry: '操作系统',
            region: '北京',
            brand: 'UnionTech UOS',
            contactName: '赵经理',
            contactPhone: '010-77777777',
            description: '国产操作系统UOS开发商'
        },
        {
            name: '达梦数据库',
            type: '软件厂商',
            industry: '数据库',
            region: '武汉',
            brand: 'DM Database',
            contactName: '刘经理',
            contactPhone: '027-88888888',
            description: '国产数据库管理系统'
        },
        {
            name: '明朝万达',
            type: '安全厂商',
            industry: '数据安全',
            region: '北京',
            brand: '明朝万达',
            contactName: '陈经理',
            contactPhone: '010-55555555',
            description: '数据安全解决方案提供商'
        },
        {
            name: 'Coremail（盈世科技）',
            type: '软件厂商',
            industry: '邮件系统',
            region: '广州',
            brand: 'Coremail',
            contactName: '周经理',
            contactPhone: '020-99999999',
            description: '企业邮件系统解决方案'
        },
        {
            name: '钉钉（让进步发生）',
            type: '软件厂商',
            industry: '协同办公',
            region: '杭州',
            brand: '钉钉',
            contactName: '吴经理',
            contactPhone: '0571-88888888',
            description: '阿里巴巴旗下企业协同办公平台'
        },
        {
            name: '宏杉科技',
            type: '硬件厂商',
            industry: '存储',
            region: '北京',
            brand: 'Macro San',
            contactName: '郑经理',
            contactPhone: '010-44444444',
            description: '企业级存储解决方案提供商'
        },
        {
            name: '企业微信',
            type: '软件厂商',
            industry: '协同办公',
            region: '深圳',
            brand: '企业微信',
            contactName: '孙经理',
            contactPhone: '0755-66666666',
            description: '腾讯旗下企业通讯与办公平台'
        },
        {
            name: '神州网信（CMIT）',
            type: '软件厂商',
            industry: '操作系统',
            region: '北京',
            brand: 'CMIT',
            contactName: '马经理',
            contactPhone: '010-33333333',
            description: '国产操作系统及安全解决方案'
        }
    ];

    for (const vendor of vendors) {
        try {
            const created = await prisma.vendor.upsert({
                where: { name: vendor.name },
                update: vendor,
                create: vendor,
            });
            console.log(`✅ 已添加/更新厂商: ${created.name}`);
        } catch (error) {
            console.error(`❌ 添加厂商失败 ${vendor.name}:`, error);
        }
    }

    console.log('✨ 厂商数据添加完成！');
}

seedVendors()
    .catch((e) => {
        console.error('❌ 种子数据添加失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
