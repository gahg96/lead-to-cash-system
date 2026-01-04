import { PrismaClient, InvoiceStatus, MilestoneStatus, InvoiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCompleteContractData() {
    console.log('开始完整数据修正...\n');

    try {
        const contractId = '81043773-e2fa-455d-bbb9-fb864d0beb70';

        // 1. 删除旧发票的收款记录
        console.log('步骤 1: 删除旧发票的收款记录...');
        await prisma.payment.deleteMany({
            where: {
                invoice: {
                    invoiceNumber: { in: ['RM-2026-00001', 'RM-2026-00002'] }
                }
            }
        });
        console.log('✓ 收款记录已删除\n');

        // 2. 作废旧发票并清除里程碑引用
        console.log('步骤 2: 作废旧发票...');
        await prisma.invoice.updateMany({
            where: {
                invoiceNumber: { in: ['RM-2026-00001', 'RM-2026-00002'] }
            },
            data: {
                status: InvoiceStatus.Cancelled,
                milestoneId: null,
                remarks: '[数据修正] 税金计算错误，已作废'
            }
        });
        console.log('✓ 旧发票已作废\n');

        // 3. 恢复里程碑状态
        console.log('步骤 3: 恢复里程碑状态...');
        await prisma.milestone.updateMany({
            where: {
                contractId,
                name: { in: ['合同签订', '项目初验'] }
            },
            data: {
                invoiceDate: null,
                paymentDate: null,
                status: MilestoneStatus.Verified
            }
        });
        console.log('✓ 里程碑状态已恢复\n');

        // 4. 调整里程碑金额以匹配合同总额 ¥208,990
        console.log('步骤 4: 调整里程碑金额...');
        console.log('合同总额: ¥208,990');
        console.log('建议分配:');
        console.log('  - 合同签订: ¥100,000');
        console.log('  - 项目初验: ¥28,990');
        console.log('  - 项目终验: ¥80,000');
        console.log('  总计: ¥208,990\n');

        // 更新项目初验金额
        await prisma.milestone.updateMany({
            where: {
                contractId,
                name: '项目初验'
            },
            data: {
                amount: 28990
            }
        });
        console.log('✓ 里程碑金额已调整\n');

        // 5. 重新开具发票（使用正确的税金计算）
        console.log('步骤 5: 重新开具发票...\n');

        // 5.1 合同签订发票
        const milestone1 = await prisma.milestone.findFirst({
            where: { contractId, name: '合同签订' }
        });

        if (milestone1) {
            const amount1 = 100000;
            const taxRate1 = 0.06;
            const amountBeforeTax1 = amount1 / (1 + taxRate1);
            const taxAmount1 = amount1 - amountBeforeTax1;

            const invoice1 = await prisma.invoice.create({
                data: {
                    invoiceNumber: 'RM-2026-00005',
                    contractId,
                    milestoneId: milestone1.id,
                    invoiceDate: new Date('2026-01-04'),
                    dueDate: new Date('2026-02-03'),
                    amount: Math.round(amountBeforeTax1 * 100) / 100,
                    taxRate: taxRate1,
                    taxAmount: Math.round(taxAmount1 * 100) / 100,
                    totalAmount: amount1,
                    type: InvoiceType.Service,
                    status: InvoiceStatus.Draft,
                    description: 'Invoice for milestone: 合同签订',
                }
            });

            await prisma.milestone.update({
                where: { id: milestone1.id },
                data: {
                    invoiceDate: new Date('2026-01-04'),
                    status: MilestoneStatus.Invoiced
                }
            });

            console.log(`✓ 发票 ${invoice1.invoiceNumber} 已创建`);
            console.log(`  含税总额: ¥${amount1.toLocaleString()}`);
            console.log(`  税前金额: ¥${Math.round(amountBeforeTax1 * 100) / 100}`);
            console.log(`  税额: ¥${Math.round(taxAmount1 * 100) / 100}\n`);
        }

        // 5.2 项目初验发票
        const milestone2 = await prisma.milestone.findFirst({
            where: { contractId, name: '项目初验' }
        });

        if (milestone2) {
            const amount2 = 28990;
            const taxRate2 = 0.06;
            const amountBeforeTax2 = amount2 / (1 + taxRate2);
            const taxAmount2 = amount2 - amountBeforeTax2;

            const invoice2 = await prisma.invoice.create({
                data: {
                    invoiceNumber: 'RM-2026-00006',
                    contractId,
                    milestoneId: milestone2.id,
                    invoiceDate: new Date('2026-01-04'),
                    dueDate: new Date('2026-02-03'),
                    amount: Math.round(amountBeforeTax2 * 100) / 100,
                    taxRate: taxRate2,
                    taxAmount: Math.round(taxAmount2 * 100) / 100,
                    totalAmount: amount2,
                    type: InvoiceType.Service,
                    status: InvoiceStatus.Draft,
                    description: 'Invoice for milestone: 项目初验',
                }
            });

            await prisma.milestone.update({
                where: { id: milestone2.id },
                data: {
                    invoiceDate: new Date('2026-01-04'),
                    status: MilestoneStatus.Invoiced
                }
            });

            console.log(`✓ 发票 ${invoice2.invoiceNumber} 已创建`);
            console.log(`  含税总额: ¥${amount2.toLocaleString()}`);
            console.log(`  税前金额: ¥${Math.round(amountBeforeTax2 * 100) / 100}`);
            console.log(`  税额: ¥${Math.round(taxAmount2 * 100) / 100}\n`);
        }

        // 6. 验证结果
        console.log('步骤 6: 验证修正结果...\n');

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                milestones: true,
                invoices: {
                    where: { status: { not: InvoiceStatus.Cancelled } }
                }
            }
        });

        if (contract) {
            const totalMilestones = contract.milestones.reduce((sum, m) => sum + Number(m.amount), 0);
            const totalInvoices = contract.invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0);

            console.log(`合同金额: ¥${Number(contract.totalContractValue).toLocaleString()}`);
            console.log(`里程碑总额: ¥${totalMilestones.toLocaleString()}`);
            console.log(`开票总额: ¥${totalInvoices.toLocaleString()}\n`);

            if (totalMilestones === Number(contract.totalContractValue)) {
                console.log('✅ 里程碑总额 = 合同金额');
            } else {
                console.log(`⚠️  里程碑总额与合同金额差异: ¥${(Number(contract.totalContractValue) - totalMilestones).toLocaleString()}`);
            }

            if (totalInvoices === totalMilestones) {
                console.log('✅ 开票总额 = 里程碑总额');
            } else {
                console.log(`⚠️  开票总额与里程碑总额差异: ¥${(totalInvoices - totalMilestones).toLocaleString()}`);
            }
        }

        console.log('\n✅ 数据修正完成！');

    } catch (error) {
        console.error('❌ 修正失败:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixCompleteContractData()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
