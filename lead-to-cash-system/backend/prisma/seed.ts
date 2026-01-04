import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始创建测试数据...');

  // 1. 创建客户
  const customer1 = await prisma.customer.create({
    data: {
      companyName: '上海青蛙科技有限公司',
      industry: '软件和信息技术服务业',
      companySize: '100-500人',
      city: '上海',
      country: '中国',
      contactName: '张三',
      contactTitle: '采购经理',
      contactPhone: '13800138000',
      contactEmail: 'zhangsan@qingwa.com',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyName: '北京科技发展有限公司',
      industry: '互联网和相关服务',
      companySize: '500-1000人',
      city: '北京',
      country: '中国',
      contactName: '李四',
      contactTitle: 'IT总监',
      contactPhone: '13900139000',
      contactEmail: 'lisi@bjtech.com',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      companyName: '深圳创新企业',
      industry: '电子信息',
      companySize: '50-100人',
      city: '深圳',
      country: '中国',
      contactName: '王五',
      contactTitle: '项目经理',
      contactPhone: '13700137000',
      contactEmail: 'wangwu@szcx.com',
    },
  });

  console.log('✓ 创建了 3 个客户');

  // 2. 创建厂商
  const vendor1 = await prisma.vendor.create({
    data: {
      name: '华为技术有限公司',
      type: '设备供应商',
      industry: '通信设备',
      region: '深圳',
      brand: '华为',
      contactName: '赵六',
      contactPhone: '13600136000',
      description: '全球领先的ICT基础设施和智能终端提供商',
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      name: '阿里云计算有限公司',
      type: '云服务商',
      industry: '云计算',
      region: '杭州',
      brand: '阿里云',
      contactName: '孙七',
      contactPhone: '13500135000',
      description: '领先的云计算及人工智能科技公司',
    },
  });

  console.log('✓ 创建了 2 个厂商');

  // 3. 创建商机
  const opp1 = await prisma.opportunity.create({
    data: {
      opportunityNumber: 'OPP-2026-0001',
      customerId: customer1.id,
      title: '清算所文档包古典项目',
      status: 'Negotiation',
      estimatedValue: 100000,
      probability: 80,
      source: '老客户推荐',
      expectedCloseDate: new Date('2026-02-28'),
      salesStage: '方案阶段',
      salesOwner: 'admin',
      dealType: '软件开发',
      deliveryModel: '敏捷开发',
      estimatedEffort: 50,
      projectBudget: 120000,
      businessCost: 5000,
      laborCost: 60000,
      otherCost: 10000,
      grossProfit: 25000,
      profitMargin: 25,
      businessType: 'PROJECT_DEVELOPMENT',
      richDescription: '<p>为清算所开发文档管理系统，包括文档上传、分类、检索等功能。</p>',
      vendors: {
        connect: [{ id: vendor1.id }],
      },
    },
  });

  const opp2 = await prisma.opportunity.create({
    data: {
      opportunityNumber: 'OPP-2026-0002',
      customerId: customer2.id,
      title: '企业云平台建设项目',
      status: 'Proposal',
      estimatedValue: 500000,
      probability: 60,
      source: '招标',
      expectedCloseDate: new Date('2026-03-31'),
      salesStage: '投标阶段',
      salesOwner: 'admin',
      dealType: '云服务',
      deliveryModel: '云部署',
      estimatedEffort: 100,
      projectBudget: 600000,
      businessCost: 20000,
      laborCost: 300000,
      otherCost: 50000,
      grossProfit: 130000,
      profitMargin: 26,
      businessType: 'PRODUCT_SALES',
      richDescription: '<p>为客户搭建企业级云平台，包括IaaS、PaaS层服务。</p>',
      vendors: {
        connect: [{ id: vendor2.id }],
      },
    },
  });

  const opp3 = await prisma.opportunity.create({
    data: {
      opportunityNumber: 'OPP-2026-0003',
      customerId: customer3.id,
      title: '智能制造系统集成',
      status: 'New',
      estimatedValue: 200000,
      probability: 40,
      source: '市场活动',
      expectedCloseDate: new Date('2026-04-30'),
      salesStage: '需求分析',
      salesOwner: 'admin',
      dealType: '系统集成',
      deliveryModel: '现场实施',
      estimatedEffort: 80,
      projectBudget: 250000,
      businessCost: 10000,
      laborCost: 120000,
      otherCost: 30000,
      grossProfit: 40000,
      profitMargin: 20,
      businessType: 'PROJECT_DEVELOPMENT',
      richDescription: '<p>为制造企业提供智能制造解决方案，包括MES、WMS等系统。</p>',
      vendors: {
        connect: [{ id: vendor1.id }],
      },
    },
  });

  console.log('✓ 创建了 3 个商机');

  // 4. 为第一个商机创建投标
  const procurement1 = await prisma.procurement.create({
    data: {
      opportunityId: opp1.id,
      procurementNumber: 'BID-2026-0001',
      type: 'DirectQuote',
      status: 'Won',
      wonPrice: 95000,
      lineItems: {
        create: [
          {
            name: '软件开发服务',
            type: 'Service',
            amount: 60000,
            description: '文档管理系统开发',
            sortOrder: 1,
          },
          {
            name: '服务器设备',
            type: 'Product',
            amount: 35000,
            description: '项目所需服务器及配套设备',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  // 5. 为第二个商机创建投标
  const procurement2 = await prisma.procurement.create({
    data: {
      opportunityId: opp2.id,
      procurementNumber: 'BID-2026-0002',
      type: 'PublicTender',
      status: 'Submitted',
      wonPrice: 480000,
      lineItems: {
        create: [
          {
            name: '云平台基础设施',
            type: 'Product',
            amount: 300000,
            description: '云服务器、存储、网络等基础设施',
            sortOrder: 1,
          },
          {
            name: '平台开发与集成',
            type: 'Service',
            amount: 150000,
            description: '云平台开发、系统集成服务',
            sortOrder: 2,
          },
          {
            name: '技术支持服务',
            type: 'Service',
            amount: 30000,
            description: '一年技术支持与运维服务',
            sortOrder: 3,
          },
        ],
      },
    },
  });

  console.log('✓ 创建了 2 个投标记录（含分项报价）');

  // 6. 为中标的投标（BID-2026-0001）创建合同
  const contract1 = await prisma.contract.create({
    data: {
      opportunityId: opp1.id,
      contractNumber: 'CNT-2026-0001',
      status: 'Signed',
      totalContractValue: 95000,
      startDate: new Date('2026-01-20'),
      endDate: new Date('2026-06-30'),
      paymentTerms: '3-3-3-1',
    },
  });
  console.log('✓ 创建了 1 个主要合同');

  // 7. 为合同创建交付项目
  const project1 = await prisma.project.create({
    data: {
      contractId: contract1.id,
      status: 'Execution',
      startDate: new Date('2026-01-20'),
      endDate: new Date('2026-06-30'),
      laborCost: 20000, // 初始预估
      outsourceCost: 5000,
      complexity: 'Medium',
      fundTransactions: {
        create: [
          {
            type: 'ADVANCE',
            description: '服务器采购垫资',
            totalAmount: 15000,
            status: 'ACTIVE',
            transactionDate: new Date('2026-01-25'),
            partyName: '阿里云',
            expectedDuration: 30,
            costRate: 0.01,
          },
          {
            type: 'PASS_THROUGH',
            description: 'Oracle 数据库授权',
            totalAmount: 8000,
            status: 'ACTIVE',
            transactionDate: new Date('2026-02-10'),
            partyName: 'Oracle代理商',
          },
          {
            type: 'SIMPLE_PASS',
            description: '临时测试设备租赁',
            totalAmount: 2000,
            status: 'ACTIVE',
            transactionDate: new Date('2026-02-15'),
            partyName: '租赁公司A',
          }
        ]
      }
    },
  });
  console.log('✓ 创建了 1 个交付项目及相关资金交易');

  console.log('\n✅ 测试数据创建完成！');
  console.log('\n数据摘要:');
  console.log(`- 客户: 3 个`);
  console.log(`- 厂商: 2 个`);
  console.log(`- 商机: 3 个`);
  console.log(`- 投标: 2 个`);
  console.log(`- 分项报价: 5 项`);
}

main()
  .catch((e) => {
    console.error('创建测试数据时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
