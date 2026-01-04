import { PrismaClient, InvoiceStatus, InvoiceType, MilestoneStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function createInvoiceManually() {
    console.log('手动创建发票...\n');

    try {
        const milestone = await prisma.milestone.findUnique({
            where: { id: 'b4ea1557-0a3d-4448-842f-8c76f3722c88' },
            include: {
                contract: {
                    include: { project: true }
                }
            }
        });

        if (!milestone) {
            throw new Error('Milestone not found');
        }

        console.log(`里程碑: ${milestone.name}`);
        console.log(`金额: ¥${Number(milestone.amount).toLocaleString()}`);
        console.log(`状态: ${milestone.status}\n`);

        // Calculate tax breakdown
        const totalAmount = Number(milestone.amount); // 80000
        const taxRate = 0.06;
        const amountBeforeTax = totalAmount / (1 + taxRate);
        const taxAmount = totalAmount - amountBeforeTax;

        console.log('税金计算:');
        console.log(`含税总额: ¥${totalAmount.toLocaleString()}`);
        console.log(`税前金额: ¥${Math.round(amountBeforeTax * 100) / 100}`);
        console.log(`税额: ¥${Math.round(taxAmount * 100) / 100}\n`);

        // Generate invoice number
        const now = new Date();
        const year = now.getFullYear();
        const count = await prisma.invoice.count();
        const invoiceNumber = `RM-${year}-${String(count + 1).padStart(5, '0')}`;

        console.log(`发票号: ${invoiceNumber}\n`);

        // Create invoice
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                contractId: milestone.contractId,
                projectId: milestone.contract?.project?.id,
                milestoneId: milestone.id,
                invoiceDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                amount: Math.round(amountBeforeTax * 100) / 100,
                taxRate,
                taxAmount: Math.round(taxAmount * 100) / 100,
                totalAmount,
                type: InvoiceType.Service,
                status: InvoiceStatus.Draft,
                description: `Invoice for milestone: ${milestone.name}`,
            }
        });

        console.log('✅ 发票创建成功!');
        console.log(`ID: ${invoice.id}`);
        console.log(`发票号: ${invoice.invoiceNumber}`);
        console.log(`总额: ¥${Number(invoice.totalAmount).toLocaleString()}\n`);

        // Update milestone
        await prisma.milestone.update({
            where: { id: milestone.id },
            data: {
                invoiceDate: new Date(),
                status: MilestoneStatus.Invoiced,
            }
        });

        console.log('✅ 里程碑状态已更新\n');
        console.log('请刷新发票列表页面查看新发票！');

    } catch (error) {
        console.error('❌ 创建失败:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createInvoiceManually()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
