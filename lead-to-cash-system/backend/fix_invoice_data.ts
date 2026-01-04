import { PrismaClient, InvoiceStatus, MilestoneStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function fixInvoiceData() {
    console.log('开始修正发票和里程碑数据...\n');

    try {
        // 1. 删除错误发票的收款记录
        console.log('步骤 1: 删除发票 RM-2026-00003 的收款记录...');
        const deletedPayments = await prisma.payment.deleteMany({
            where: {
                invoice: {
                    invoiceNumber: 'RM-2026-00003'
                }
            }
        });
        console.log(`✓ 已删除 ${deletedPayments.count} 条收款记录\n`);

        // 2. 作废错误的发票
        console.log('步骤 2: 作废发票 RM-2026-00003...');
        const invoice = await prisma.invoice.findFirst({
            where: { invoiceNumber: 'RM-2026-00003' },
            include: { milestone: true }
        });

        if (invoice) {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: {
                    status: InvoiceStatus.Cancelled,
                    remarks: `${invoice.remarks || ''}\n[数据修正] 金额错误，已作废`.trim()
                }
            });
            console.log(`✓ 发票已作废\n`);

            // 3. 恢复里程碑状态
            if (invoice.milestoneId) {
                console.log('步骤 3: 恢复里程碑状态...');
                await prisma.milestone.update({
                    where: { id: invoice.milestoneId },
                    data: {
                        invoiceDate: null,
                        paymentDate: null,
                        status: MilestoneStatus.Verified
                    }
                });
                console.log(`✓ 里程碑状态已恢复为"已验收"\n`);
            }
        }

        // 4. 修正里程碑金额
        console.log('步骤 4: 修正里程碑"项目终验"金额...');
        const milestone = await prisma.milestone.findFirst({
            where: {
                name: '项目终验',
                contract: {
                    contractNumber: 'CTR-2026-8089'
                }
            },
            include: {
                contract: {
                    include: { milestones: true }
                }
            }
        });

        if (milestone) {
            console.log(`当前金额: ¥${Number(milestone.amount).toLocaleString()}`);

            // 计算应该的金额
            const contractValue = Number(milestone.contract.totalContractValue);
            const otherMilestonesTotal = milestone.contract.milestones
                .filter(m => m.id !== milestone.id)
                .reduce((sum, m) => sum + Number(m.amount), 0);
            const correctAmount = contractValue - otherMilestonesTotal;

            console.log(`合同金额: ¥${contractValue.toLocaleString()}`);
            console.log(`其他里程碑总额: ¥${otherMilestonesTotal.toLocaleString()}`);
            console.log(`应为金额: ¥${correctAmount.toLocaleString()}`);

            await prisma.milestone.update({
                where: { id: milestone.id },
                data: { amount: correctAmount }
            });
            console.log(`✓ 里程碑金额已修正为 ¥${correctAmount.toLocaleString()}\n`);
        }

        // 5. 验证结果
        console.log('步骤 5: 验证修正结果...');
        const contract = await prisma.contract.findFirst({
            where: { contractNumber: 'CTR-2026-8089' },
            include: { milestones: true }
        });

        if (contract) {
            const totalMilestoneAmount = contract.milestones.reduce(
                (sum, m) => sum + Number(m.amount),
                0
            );
            console.log(`合同金额: ¥${Number(contract.totalContractValue).toLocaleString()}`);
            console.log(`里程碑总额: ¥${totalMilestoneAmount.toLocaleString()}`);

            if (totalMilestoneAmount === Number(contract.totalContractValue)) {
                console.log('✓ 验证通过：里程碑总额等于合同金额\n');
            } else {
                console.log('⚠️  警告：里程碑总额与合同金额不符\n');
            }
        }

        console.log('✅ 数据修正完成！');
        console.log('\n下一步：');
        console.log('1. 刷新发票详情页，确认发票已作废');
        console.log('2. 从里程碑重新开具正确金额的发票');

    } catch (error) {
        console.error('❌ 修正失败:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixInvoiceData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
