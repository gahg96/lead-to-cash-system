
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const customers = [
    // 1. Exchanges & Financial Infrastructure (交易所/金融基础设施)
    {
        companyName: '中国外汇交易中心',
        industry: 'Financial Services',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '李华',
        contactTitle: '市场部经理',
        contactPhone: '13800238001',
        contactEmail: 'lihua@cfets.com.cn'
    },
    {
        companyName: '上海票据交易所',
        industry: 'Financial Services',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '王建国',
        contactTitle: '技术部总监',
        contactPhone: '13900239002',
        contactEmail: 'wangjg@shcpe.com.cn'
    },
    {
        companyName: '上海清算所',
        industry: 'Financial Services',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '陈明',
        contactTitle: '运营总监',
        contactPhone: '13700237003',
        contactEmail: 'chenming@shch.com.cn'
    },
    {
        companyName: '上海联合产权交易所',
        industry: 'Financial Services',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '张强',
        contactTitle: '信息中心主任',
        contactPhone: '13600236004',
        contactEmail: 'zhangqiang@suaee.com'
    },

    // 2. State-owned Enterprises & Groups (国企集团)
    {
        companyName: '中国移动',
        industry: 'Telecommunications',
        companySize: 'Enterprise',
        city: 'Beijing',
        contactName: '刘波',
        contactTitle: '政企客户部经理',
        contactPhone: '13500235005',
        contactEmail: 'liubo@chinamobile.com'
    },
    {
        companyName: '上海国际集团',
        industry: 'Investment',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '赵雷',
        contactTitle: '投资管理部总监',
        contactPhone: '13300233006',
        contactEmail: 'zhaolei@sigchina.com'
    },
    {
        companyName: '上咨集团',
        industry: 'Consulting',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '孙毅',
        contactTitle: '业务总监',
        contactPhone: '13100231007',
        contactEmail: 'sunyi@sicc.sh.cn'
    },
    {
        companyName: '东浩兰生',
        industry: 'Services',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '吴军',
        contactTitle: '人力资源总监',
        contactPhone: '13000230008',
        contactEmail: 'wujun@dlg.com.cn'
    },
    {
        companyName: '上海电气',
        industry: 'Manufacturing',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '郑和',
        contactTitle: '数字化中心主任',
        contactPhone: '13811238111',
        contactEmail: 'zhenghe@shanghai-electric.com'
    },
    {
        companyName: '上汽集团',
        industry: 'Automotive',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '钱多多',
        contactTitle: 'IT高级经理',
        contactPhone: '13911239112',
        contactEmail: 'qiandd@saicmotor.com'
    },
    {
        companyName: '申能',
        industry: 'Energy',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '周光',
        contactTitle: '信息部经理',
        contactPhone: '13722237223',
        contactEmail: 'zhouguang@shenergy.com.cn'
    },
    {
        companyName: '上海机场',
        industry: 'Transportation',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '韩飞',
        contactTitle: '指挥中心主任',
        contactPhone: '13622236224',
        contactEmail: 'hanfei@shairport.com'
    },

    // 3. Media & Technology (传媒/科技)
    {
        companyName: '上海智能交通',
        industry: 'Technology',
        companySize: 'Medium',
        city: 'Shanghai',
        contactName: '冯智',
        contactTitle: '技术总监',
        contactPhone: '13711237113',
        contactEmail: 'fengzhi@sict.com'
    },
    {
        companyName: '东方明珠',
        industry: 'Media',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '卫视',
        contactTitle: '数字媒体部总监',
        contactPhone: '13611236114',
        contactEmail: 'weishi@opg.cn'
    },
    {
        companyName: '东方有线',
        industry: 'Telecommunications',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '蒋文',
        contactTitle: '网络维护部经理',
        contactPhone: '13511235115',
        contactEmail: 'jiangwen@ocn.net.cn'
    },
    {
        companyName: '润电能源',
        industry: 'Energy',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '沈力',
        contactTitle: '工程部经理',
        contactPhone: '13822238221',
        contactEmail: 'shenli@rundian.com'
    },
    {
        companyName: '福建省高速公路信息科技',
        industry: 'Technology',
        companySize: 'Medium',
        city: 'Fuzhou',
        contactName: '林路',
        contactTitle: '研发部经理',
        contactPhone: '13933239332',
        contactEmail: 'linlu@fjgsit.com'
    },
    {
        companyName: '上海机械设备成套',
        industry: 'Manufacturing',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '杨工',
        contactTitle: '销售总监',
        contactPhone: '13844238441',
        contactEmail: 'yanggong@shmec.com'
    },
    {
        companyName: 'FAF瑞福德',
        industry: 'Automotive',
        companySize: 'Medium',
        city: 'Shanghai',
        contactName: 'Tom Wang',
        contactTitle: 'Purchasing Manager',
        contactPhone: '13744237442',
        contactEmail: 'tom.wang@faf.com'
    },


    // 4. Public Services (Healthcare, Education, Gov)
    {
        companyName: '上海市第一人民医院',
        industry: 'Healthcare',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '陈医',
        contactTitle: '信息科科长',
        contactPhone: '13822238221',
        contactEmail: 'chenyi@shgeneral.org'
    },
    {
        companyName: '厦门大学',
        industry: 'Education',
        companySize: 'Large',
        city: 'Xiamen',
        contactName: '李教授',
        contactTitle: '信息网络中心主任',
        contactPhone: '13922239222',
        contactEmail: 'profli@xmu.edu.cn'
    },
    {
        companyName: '四川省经济和信息化厅',
        industry: 'Government',
        companySize: 'Large',
        city: 'Chengdu',
        contactName: '王处长',
        contactTitle: '信息化处处长',
        contactPhone: '13722237223',
        contactEmail: 'wangchu@scjxt.gov.cn'
    },
    {
        companyName: '贵州消防网',
        industry: 'Government',
        companySize: 'Medium',
        city: 'Guiyang',
        contactName: '张队',
        contactTitle: '网络安全负责人',
        contactPhone: '13622236224',
        contactEmail: 'zhangdui@gzxf.gov.cn'
    },
];

async function main() {
    console.log('Start seeding other customers...');

    for (const customer of customers) {
        // Check if exists by name to avoid duplicates
        const existing = await prisma.customer.findFirst({
            where: { companyName: customer.companyName }
        });

        if (existing) {
            console.log(`Customer ${customer.companyName} already exists, skipping.`);
            continue;
        }

        await prisma.customer.create({
            data: {
                companyName: customer.companyName,
                industry: customer.industry,
                companySize: customer.companySize,
                city: customer.city,
                country: 'China',
                contactName: customer.contactName,
                contactTitle: customer.contactTitle,
                contactPhone: customer.contactPhone,
                contactEmail: customer.contactEmail,
            }
        });
        console.log(`Created customer: ${customer.companyName}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
