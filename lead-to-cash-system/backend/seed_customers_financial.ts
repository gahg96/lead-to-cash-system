
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const customers = [
    // 1. Banks (银行)
    {
        companyName: '中国工商银行',
        industry: 'Banking',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '张伟',
        contactTitle: '金融科技部总经理',
        contactPhone: '13800138001',
        contactEmail: 'zhangwei@icbc.com.cn'
    },
    {
        companyName: '交通银行',
        industry: 'Banking',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '李娜',
        contactTitle: '软件开发中心总监',
        contactPhone: '13900139002',
        contactEmail: 'lina@bankcomm.com'
    },
    {
        companyName: '兴业银行',
        industry: 'Banking',
        companySize: 'Enterprise',
        city: 'Fuzhou',
        contactName: '王强',
        contactTitle: '信息科技部副总',
        contactPhone: '13700137003',
        contactEmail: 'wangqiang@cib.com.cn'
    },
    {
        companyName: '浦发银行',
        industry: 'Banking',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '陈杰',
        contactTitle: '数据中心主管',
        contactPhone: '13600136004',
        contactEmail: 'chenjie@spdb.com.cn'
    },
    {
        companyName: '宁波银行',
        industry: 'Banking',
        companySize: 'Enterprise',
        city: 'Ningbo',
        contactName: '刘洋',
        contactTitle: '网络金融部经理',
        contactPhone: '13500135005',
        contactEmail: 'liuyang@nbcb.com.cn'
    },
    {
        companyName: '福建农信',
        industry: 'Banking',
        companySize: 'Large',
        city: 'Fuzhou',
        contactName: '林峰',
        contactTitle: '科技部总经理',
        contactPhone: '13300133006',
        contactEmail: 'linfeng@fjnx.com.cn'
    },
    {
        companyName: '上海农商银行',
        industry: 'Banking',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '赵敏',
        contactTitle: '创新实验室负责人',
        contactPhone: '13100131007',
        contactEmail: 'zhaomin@shrcb.com'
    },
    {
        companyName: '福建海峡银行',
        industry: 'Banking',
        companySize: 'Large',
        city: 'Fuzhou',
        contactName: '黄勇',
        contactTitle: '系统运维部经理',
        contactPhone: '13000130008',
        contactEmail: 'huangyong@fjhxbank.com'
    },

    // 2. Securities (证券)
    {
        companyName: '上海证券交易所',
        industry: 'Securities',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '周涛',
        contactTitle: '技术规划部总监',
        contactPhone: '13811138111',
        contactEmail: 'zhoutao@sse.com.cn'
    },
    {
        companyName: '国泰君安证券',
        industry: 'Securities',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '吴刚',
        contactTitle: '信息技术总监',
        contactPhone: '13911139112',
        contactEmail: 'wugang@gtja.com'
    },
    {
        companyName: '光大证券',
        industry: 'Securities',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '徐磊',
        contactTitle: '金融科技部VP',
        contactPhone: '13711137113',
        contactEmail: 'xulei@ebscn.com'
    },
    {
        companyName: '兴业证券',
        industry: 'Securities',
        companySize: 'Enterprise',
        city: 'Fuzhou',
        contactName: '郑勇',
        contactTitle: '系统架构师',
        contactPhone: '13611136114',
        contactEmail: 'zhengyong@xyzq.com.cn'
    },
    {
        companyName: '华福证券',
        industry: 'Securities',
        companySize: 'Large',
        city: 'Fuzhou',
        contactName: '孙亮',
        contactTitle: '研发中心主管',
        contactPhone: '13511135115',
        contactEmail: 'sunliang@huafu.com.cn'
    },

    // 3. Futures (期货)
    {
        companyName: '上海期货交易所',
        industry: 'Futures',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '马云龙',
        contactTitle: '技术运行部总监',
        contactPhone: '13822138221',
        contactEmail: 'mayunlong@shfe.com.cn'
    },
    {
        companyName: '建信期货',
        industry: 'Futures',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '朱丽',
        contactTitle: 'IT经理',
        contactPhone: '13922139222',
        contactEmail: 'zhuli@ccbfutures.com'
    },
    {
        companyName: '东证期货',
        industry: 'Futures',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '何强',
        contactTitle: '交易系统负责人',
        contactPhone: '13722137223',
        contactEmail: 'heqiang@orientfutures.com'
    },

    // 4. Funds (基金)
    {
        companyName: '汇添富基金',
        industry: 'Fund',
        companySize: 'Large',
        city: 'Shanghai',
        contactName: '高山',
        contactTitle: '互联网金融部经理',
        contactPhone: '13833138331',
        contactEmail: 'gaoshan@htffund.com'
    },
    {
        companyName: '德邦基金',
        industry: 'Fund',
        companySize: 'Mid-Market',
        city: 'Shanghai',
        contactName: '李思思',
        contactTitle: '信息技术部主管',
        contactPhone: '13933139332',
        contactEmail: 'lisisi@dbfund.com.cn'
    },

    // 5. Insurance (保险)
    {
        companyName: '中国太平',
        industry: 'Insurance',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '王凯',
        contactTitle: '数字化转型办公室主任',
        contactPhone: '13844138441',
        contactEmail: 'wangkai@cntaiping.com'
    },
    {
        companyName: '中信保诚',
        industry: 'Insurance',
        companySize: 'Enterprise',
        city: 'Shanghai',
        contactName: '张晓明',
        contactTitle: '科技创新部总经理',
        contactPhone: '13944139442',
        contactEmail: 'zhangxiaoming@citic-pru.com.cn'
    }
];

async function main() {
    console.log('Start seeding financial customers...');

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
