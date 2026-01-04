import { PrismaClient, ContractStatus, OpportunityStatus, MilestoneStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Initializing Taiping Life Project...');

    // 1. Create/Find Customer
    const customerName = '太平人寿保险有限公司';
    let customer = await prisma.customer.findFirst({
        where: { companyName: customerName }
    });

    if (!customer) {
        customer = await prisma.customer.create({
            data: {
                companyName: customerName,
                industry: '保险/金融',
                city: '上海',
                companySize: 'Enterprise',
                contactName: '待补充',
                contactPhone: '-'
            }
        });
        console.log('Created Customer:', customer.companyName);
    } else {
        console.log('Found Customer:', customer.companyName);
    }

    // 2. Create Opportunity
    const oppTitle = '云原生容器容灾软件及维护服务';
    let opportunity = await prisma.opportunity.findFirst({
        where: {
            customerId: customer.id,
            title: oppTitle
        }
    });

    if (!opportunity) {
        opportunity = await prisma.opportunity.create({
            data: {
                title: oppTitle,
                customerId: customer.id,
                estimatedValue: 663000,
                status: OpportunityStatus.Won,
                expectedCloseDate: new Date('2025-12-15'),
                salesOwner: 'user-id-placeholder'
            }
        });
        console.log('Created Opportunity:', opportunity.title);
    }

    // 3. Create Contract
    const contractNumber = 'CP-TPL-2025-G1-010';
    let contract = await prisma.contract.findUnique({
        where: { contractNumber }
    });

    if (!contract) {
        contract = await prisma.contract.create({
            data: {
                contractNumber,
                opportunityId: opportunity.id,
                // customerId: customer.id, // Removed: Not in schema, linked via Opportunity
                totalContractValue: 663000,
                wonPrice: 663000,
                status: ContractStatus.Signed,
                startDate: new Date('2025-12-20'),
                endDate: new Date('2026-12-31'),
                scope: '含软件许可 ¥520,000 及实施服务 ¥143,000'
            }
        });
        console.log('Created Contract:', contract.contractNumber);

        // 4. Create Milestones
        // Milestone 1: Software License (100% after delivery)
        await prisma.milestone.create({
            data: {
                name: '云原生容器容灾软件许可',
                contractId: contract.id,
                amount: 520000,
                status: MilestoneStatus.Pending,
                acceptanceNote: '交付软件许可及授权书，验收后付款 100%'
            }
        });
        console.log('Created Milestone: 软件许可 (¥520,000)');

        // Milestone 2: Technical Service (100% after acceptance)
        await prisma.milestone.create({
            data: {
                name: '平台集成实施服务',
                contractId: contract.id,
                amount: 143000,
                status: MilestoneStatus.Pending,
                acceptanceNote: '完成实施并验收合格，付款 100%'
            }
        });
        console.log('Created Milestone: 实施服务 (¥143,000)');

    } else {
        console.log('Contract already exists:', contract.contractNumber);
    }

    console.log('Initialization Complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
