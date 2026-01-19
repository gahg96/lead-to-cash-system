"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const prefix = `RM-${year}-`;
        const lastInvoice = await this.prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                invoiceNumber: 'desc',
            },
        });
        let sequence = 1;
        if (lastInvoice) {
            const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }
        return `${prefix}${sequence.toString().padStart(5, '0')}`;
    }
    calculateTaxBreakdown(totalAmount, type) {
        const taxRate = type === client_1.InvoiceType.Service ? 0.06 : 0.13;
        const amountBeforeTax = totalAmount / (1 + taxRate);
        const taxAmount = totalAmount - amountBeforeTax;
        return {
            amountBeforeTax: Math.round(amountBeforeTax * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            taxRate,
        };
    }
    async createInvoice(dto) {
        try {
            console.log("Creating invoice with DTO:", JSON.stringify(dto));
            const contract = await this.prisma.contract.findUnique({
                where: { id: dto.contractId },
            });
            if (!contract) {
                throw new common_1.NotFoundException('Contract not found');
            }
            if (dto.milestoneId) {
                const existingInvoice = await this.prisma.invoice.findUnique({
                    where: { milestoneId: dto.milestoneId },
                    include: { contract: true }
                });
                if (existingInvoice) {
                    console.log(`Found existing invoice ${existingInvoice.invoiceNumber} for milestone ${dto.milestoneId}. Recovering...`);
                    await this.prisma.milestone.update({
                        where: { id: dto.milestoneId },
                        data: {
                            invoiceDate: existingInvoice.invoiceDate,
                            status: client_1.MilestoneStatus.Invoiced,
                        },
                    });
                    return existingInvoice;
                }
            }
            if (dto.milestoneId) {
                const milestone = await this.prisma.milestone.findUnique({
                    where: { id: dto.milestoneId },
                });
                if (!milestone) {
                    throw new common_1.NotFoundException('Milestone not found');
                }
                if (milestone.invoiceDate) {
                    throw new common_1.BadRequestException('Milestone already has an invoice');
                }
            }
            let retryCount = 0;
            const maxRetries = 3;
            while (retryCount < maxRetries) {
                try {
                    const invoiceNumber = await this.generateInvoiceNumber();
                    const taxBreakdown = this.calculateTaxBreakdown(dto.amount, dto.type);
                    const totalAmount = dto.amount;
                    const amountBeforeTax = taxBreakdown.amountBeforeTax;
                    const taxAmount = taxBreakdown.taxAmount;
                    const taxRate = taxBreakdown.taxRate;
                    const result = await this.prisma.$transaction(async (tx) => {
                        const invoice = await tx.invoice.create({
                            data: {
                                invoiceNumber,
                                contractId: dto.contractId,
                                projectId: dto.projectId,
                                milestoneId: dto.milestoneId,
                                invoiceDate: new Date(dto.invoiceDate),
                                dueDate: new Date(dto.dueDate),
                                amount: amountBeforeTax,
                                taxRate,
                                taxAmount,
                                totalAmount,
                                type: dto.type,
                                status: client_1.InvoiceStatus.Draft,
                                description: dto.description,
                                remarks: dto.remarks,
                            },
                            include: {
                                contract: {
                                    include: {
                                        opportunity: {
                                            include: {
                                                customer: true,
                                            },
                                        },
                                    },
                                },
                                project: true,
                                milestone: true,
                            },
                        });
                        if (dto.milestoneId) {
                            await tx.milestone.update({
                                where: { id: dto.milestoneId },
                                data: {
                                    invoiceDate: new Date(dto.invoiceDate),
                                    status: client_1.MilestoneStatus.Invoiced,
                                },
                            });
                        }
                        return invoice;
                    });
                    return result;
                }
                catch (error) {
                    if (error.code === 'P2002' && error.meta?.target?.includes('invoiceNumber')) {
                        retryCount++;
                        console.warn(`Invoice number collision detected. Retrying... (${retryCount}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }
                    throw error;
                }
            }
            throw new common_1.BadRequestException('Failed to generate unique invoice number after multiple retries. Please try again.');
        }
        catch (error) {
            console.error("Create Invoice Error:", error);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Failed to create invoice: ${error.message}`);
        }
    }
    async findOneMilestone(id) {
        return this.prisma.milestone.findUnique({
            where: { id },
            include: {
                contract: {
                    include: {
                        project: true
                    }
                },
                invoice: true,
            },
        });
    }
    async createInvoiceFromMilestone(milestoneId, dto) {
        const milestone = await this.prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: { project: true }
                },
            },
        });
        if (!milestone) {
            throw new common_1.NotFoundException('Milestone not found');
        }
        if (milestone.invoiceDate) {
            throw new common_1.BadRequestException('Milestone already has an invoice');
        }
        const invoiceDto = {
            contractId: milestone.contractId,
            projectId: milestone.contract?.project?.id,
            milestoneId: milestone.id,
            amount: Number(milestone.amount),
            invoiceDate: dto.invoiceDate || new Date().toISOString(),
            dueDate: dto.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            type: dto.type || client_1.InvoiceType.Service,
            description: dto.description || `Invoice for milestone: ${milestone.name}`,
            remarks: dto.remarks,
        };
        return this.createInvoice(invoiceDto);
    }
    async findAll() {
        return this.prisma.invoice.findMany({
            include: {
                contract: {
                    include: {
                        opportunity: {
                            include: {
                                customer: true,
                            },
                        },
                    },
                },
                project: true,
                milestone: true,
                payments: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(id) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                contract: {
                    include: {
                        opportunity: {
                            include: {
                                customer: true,
                            },
                        },
                    },
                },
                project: true,
                milestone: true,
                payments: true,
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return invoice;
    }
    async updateStatus(id, status) {
        const invoice = await this.findOne(id);
        return this.prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }
    async updateInvoice(id, updateData) {
        const invoice = await this.findOne(id);
        return this.prisma.invoice.update({
            where: { id },
            data: updateData,
        });
    }
    async voidInvoice(id, reason) {
        const invoice = await this.findOne(id);
        if (invoice.status === client_1.InvoiceStatus.Cancelled) {
            throw new common_1.BadRequestException('Invoice is already cancelled');
        }
        if (invoice.status === client_1.InvoiceStatus.Paid) {
            throw new common_1.BadRequestException('Cannot void a paid invoice. Please process refund first.');
        }
        const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        if (totalPaid > 0) {
            throw new common_1.BadRequestException('Cannot void invoice with payments. Please handle refunds first.');
        }
        const voidedInvoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                status: client_1.InvoiceStatus.Cancelled,
                remarks: reason ? `${invoice.remarks || ''}\n[作废原因] ${reason}`.trim() : invoice.remarks,
                milestoneId: null,
            },
        });
        if (invoice.milestoneId) {
            await this.prisma.milestone.update({
                where: { id: invoice.milestoneId },
                data: {
                    invoiceDate: null,
                    status: client_1.MilestoneStatus.Verified,
                },
            });
        }
        return voidedInvoice;
    }
    async createPayment(dto) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: dto.invoiceId },
            include: {
                contract: {
                    include: {
                        opportunity: {
                            include: { customer: true }
                        }
                    }
                },
                project: true
            }
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const year = new Date().getFullYear();
        const prefix = `PAY-${year}-`;
        const lastPayment = await this.prisma.payment.findFirst({
            where: { paymentNumber: { startsWith: prefix } },
            orderBy: { paymentNumber: 'desc' },
        });
        let sequence = 1;
        if (lastPayment) {
            const lastSeq = parseInt(lastPayment.paymentNumber.split('-')[2]);
            sequence = lastSeq + 1;
        }
        const paymentNumber = `${prefix}${sequence.toString().padStart(5, '0')}`;
        const payment = await this.prisma.payment.create({
            data: {
                paymentNumber,
                invoiceId: dto.invoiceId,
                paymentDate: new Date(dto.paymentDate),
                amount: dto.amount,
                paymentMethod: dto.paymentMethod,
                bankName: dto.bankName,
                transactionRef: dto.transactionRef,
                remarks: dto.remarks,
            },
        });
        const totalPayments = await this.prisma.payment.aggregate({
            where: { invoiceId: dto.invoiceId },
            _sum: { amount: true },
        });
        const totalPaid = totalPayments._sum.amount || 0;
        let newStatus = invoice.status;
        if (totalPaid >= invoice.totalAmount) {
            newStatus = client_1.InvoiceStatus.Paid;
            if (invoice.milestoneId) {
                await this.prisma.milestone.update({
                    where: { id: invoice.milestoneId },
                    data: {
                        paymentDate: new Date(dto.paymentDate),
                        status: client_1.MilestoneStatus.Paid,
                    },
                });
            }
        }
        else if (totalPaid > 0) {
            newStatus = client_1.InvoiceStatus.PartiallyPaid;
        }
        if (newStatus !== invoice.status) {
            await this.updateStatus(dto.invoiceId, newStatus);
        }
        await this.createFundTransactionForPayment(invoice, payment);
        return payment;
    }
    async createFundTransactionForPayment(invoice, payment) {
        if (!invoice.projectId)
            return;
        try {
            await this.prisma.fundTransaction.create({
                data: {
                    projectId: invoice.projectId,
                    type: client_1.FundTransactionType.SIMPLE_PASS,
                    status: client_1.FundTransactionStatus.COMPLETED,
                    description: `Invoice Payment: ${invoice.invoiceNumber}`,
                    transactionDate: payment.paymentDate,
                    totalAmount: payment.amount,
                    collections: {
                        create: {
                            amount: payment.amount,
                            receivedDate: payment.paymentDate,
                            customerName: invoice.contract?.opportunity?.customer?.companyName || 'Unknown Customer',
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Failed to create fund transaction for payment', error);
        }
    }
    async syncTransactions() {
        const payments = await this.prisma.payment.findMany({
            include: {
                invoice: {
                    include: {
                        project: true,
                        contract: {
                            include: {
                                opportunity: {
                                    include: { customer: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        let syncedCount = 0;
        for (const payment of payments) {
            if (!payment.invoice.projectId)
                continue;
            const existing = await this.prisma.fundTransaction.findFirst({
                where: {
                    projectId: payment.invoice.projectId,
                    totalAmount: payment.amount,
                    transactionDate: payment.paymentDate,
                    type: client_1.FundTransactionType.SIMPLE_PASS
                }
            });
            if (!existing) {
                await this.createFundTransactionForPayment(payment.invoice, payment);
                syncedCount++;
            }
        }
        return { message: `Synced ${syncedCount} transactions` };
    }
    async getDashboardData() {
        const invoices = await this.prisma.invoice.findMany({
            include: {
                payments: true,
                milestone: true,
            },
        });
        let pendingInvoiceAmount = 0;
        let outstandingAmount = 0;
        let paidAmount = 0;
        for (const invoice of invoices) {
            const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            if (invoice.status === client_1.InvoiceStatus.Draft) {
            }
            else if (invoice.status === client_1.InvoiceStatus.Paid) {
                paidAmount += invoice.totalAmount;
            }
            else {
                outstandingAmount += (invoice.totalAmount - totalPaid);
            }
        }
        const readyToInvoiceMilestones = await this.prisma.milestone.findMany({
            where: {
                status: {
                    in: [client_1.MilestoneStatus.Verified, client_1.MilestoneStatus.Ready_to_Invoice],
                },
            },
            include: {
                contract: {
                    include: {
                        opportunity: {
                            include: {
                                customer: true,
                            },
                        },
                    },
                },
            },
        });
        const pendingInvoiceAmountFromMilestones = readyToInvoiceMilestones.reduce((sum, m) => sum + Number(m.amount), 0);
        const agingAnalysis = {
            notDue: 0,
            overdue30: 0,
            overdue90: 0,
            overdueMore: 0,
        };
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        for (const invoice of invoices) {
            if (invoice.status === client_1.InvoiceStatus.Issued || invoice.status === client_1.InvoiceStatus.PartiallyPaid || invoice.status === client_1.InvoiceStatus.Overdue) {
                const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = invoice.totalAmount - totalPaid;
                const dueDate = new Date(invoice.dueDate);
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / oneDay);
                if (diffDays <= 0) {
                    agingAnalysis.notDue += remaining;
                }
                else if (diffDays <= 30) {
                    agingAnalysis.overdue30 += remaining;
                }
                else if (diffDays <= 90) {
                    agingAnalysis.overdue90 += remaining;
                }
                else {
                    agingAnalysis.overdueMore += remaining;
                }
            }
        }
        const projectHealth = [];
        const projects = await this.prisma.project.findMany({
            include: {
                contract: true,
                invoices: {
                    include: { payments: true }
                },
                fundTransactions: true
            }
        });
        for (const project of projects) {
            const contractValue = Number(project.contract?.wonPrice || project.contract?.totalContractValue || 0);
            let billedAmount = 0;
            let collectedAmount = 0;
            const contractInvoices = await this.prisma.invoice.findMany({
                where: { contractId: project.contractId },
                include: { payments: true }
            });
            for (const inv of contractInvoices) {
                if (inv.status !== client_1.InvoiceStatus.Cancelled && inv.status !== client_1.InvoiceStatus.Draft) {
                    billedAmount += inv.totalAmount;
                    collectedAmount += inv.payments.reduce((sum, p) => sum + p.amount, 0);
                }
            }
            const transactionTotal = project.fundTransactions?.filter(tx => tx.status !== 'ARCHIVED').reduce((sum, tx) => sum + Number(tx.totalAmount), 0) || 0;
            const totalCost = Number(project.laborCost || 0) +
                Number(project.outsourceCost || 0) +
                Number(project.travelCost || 0) +
                Number(project.emergencySupportCost || 0) +
                Number(project.thirdPartyEquipmentCost || 0) +
                Number(project.softwareCost || 0) +
                Number(project.otherWeight || 0) +
                transactionTotal;
            const grossMargin = contractValue - totalCost;
            const profitMargin = contractValue > 0 ? (grossMargin / contractValue) * 100 : 0;
            const milestones = await this.prisma.milestone.findMany({
                where: { contractId: project.contractId }
            });
            const blockerCount = milestones.filter(m => m.status === client_1.MilestoneStatus.Verified).length;
            projectHealth.push({
                id: project.id,
                displayName: project.contract ? `${project.contract.contractNumber}` : 'Unnamed Project',
                customerName: 'Loading...',
                contractValue,
                billedAmount,
                collectedAmount,
                totalCost,
                grossMargin,
                profitMargin,
                blockerCount
            });
        }
        const enrichedProjects = await Promise.all(projectHealth.map(async (p) => {
            const contractId = projects.find(proj => proj.id === p.id)?.contractId;
            if (!contractId)
                return p;
            const contract = await this.prisma.contract.findUnique({
                where: { id: contractId },
                include: { opportunity: { include: { customer: true } } }
            });
            return {
                ...p,
                displayName: contract?.opportunity?.title || p.displayName,
                customerName: contract?.opportunity?.customer?.companyName || 'Unknown'
            };
        }));
        return {
            pendingInvoiceAmount: pendingInvoiceAmountFromMilestones,
            outstandingAmount,
            paidAmount,
            readyToInvoiceMilestones,
            recentInvoices: invoices.slice(0, 10),
            agingAnalysis,
            projectHealth: enrichedProjects
        };
    }
    async createMilestoneTemplate(data) {
        return this.prisma.milestoneTemplate.create({
            data: {
                name: data.name,
                description: data.description,
                milestones: data.milestones,
                isActive: data.isActive ?? true,
            },
        });
    }
    async findAllTemplates() {
        return this.prisma.milestoneTemplate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOneTemplate(id) {
        const template = await this.prisma.milestoneTemplate.findUnique({
            where: { id },
        });
        if (!template) {
            throw new common_1.NotFoundException('Template not found');
        }
        return template;
    }
    async updateTemplate(id, data) {
        await this.findOneTemplate(id);
        return this.prisma.milestoneTemplate.update({
            where: { id },
            data,
        });
    }
    async deleteTemplate(id) {
        await this.findOneTemplate(id);
        return this.prisma.milestoneTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async uploadReceipt(id, file) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return this.prisma.invoice.update({
            where: { id },
            data: {
                filePath: file.path,
                fileName: file.filename,
            },
        });
    }
    async uploadPaymentReceipt(id, file) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        return this.prisma.payment.update({
            where: { id },
            data: {
                filePath: file.path,
                fileName: file.filename,
            },
        });
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map