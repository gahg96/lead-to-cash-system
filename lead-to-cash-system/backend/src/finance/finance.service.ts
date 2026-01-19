import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvoiceType, InvoiceStatus, MilestoneStatus, FundTransactionType, FundTransactionStatus } from '@prisma/client';

export interface ProjectHealthMetric {
    id: string;
    displayName: string;
    customerName: string;
    contractValue: number;
    billedAmount: number;
    collectedAmount: number;
    totalCost: number;
    grossMargin: number;
    profitMargin: number;
    blockerCount: number;
}

@Injectable()
export class FinanceService {
    constructor(private prisma: PrismaService) { }

    /**
     * Generate invoice number in format: RM-YYYY-XXXXX
     */
    async generateInvoiceNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `RM-${year}-`;

        // Find the last invoice for this year
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

    /**
     * Calculate tax breakdown from tax-inclusive amount
     * 从含税金额反推税前金额和税额
     * Service: 6%, Product: 13%
     */
    calculateTaxBreakdown(totalAmount: number, type: InvoiceType): {
        amountBeforeTax: number;
        taxAmount: number;
        taxRate: number;
    } {
        const taxRate = type === InvoiceType.Service ? 0.06 : 0.13;
        const amountBeforeTax = totalAmount / (1 + taxRate);
        const taxAmount = totalAmount - amountBeforeTax;

        return {
            amountBeforeTax: Math.round(amountBeforeTax * 100) / 100,
            taxAmount: Math.round(taxAmount * 100) / 100,
            taxRate,
        };
    }

    /**
     * Create invoice
     */
    async createInvoice(dto: CreateInvoiceDto) {
        try {
            console.log("Creating invoice with DTO:", JSON.stringify(dto));
            // Validate contract exists
            const contract = await this.prisma.contract.findUnique({
                where: { id: dto.contractId },
            });

            if (!contract) {
                throw new NotFoundException('Contract not found');
            }

            // Check if invoice already exists for this milestone (Idempotency / Recovery)
            if (dto.milestoneId) {
                const existingInvoice = await this.prisma.invoice.findUnique({
                    where: { milestoneId: dto.milestoneId },
                    include: { contract: true }
                });

                if (existingInvoice) {
                    console.log(`Found existing invoice ${existingInvoice.invoiceNumber} for milestone ${dto.milestoneId}. Recovering...`);
                    // Ensure milestone is updated
                    await this.prisma.milestone.update({
                        where: { id: dto.milestoneId },
                        data: {
                            invoiceDate: existingInvoice.invoiceDate,
                            status: MilestoneStatus.Invoiced,
                        },
                    });
                    return existingInvoice;
                }
            }

            // If milestone is specified, validate it
            if (dto.milestoneId) {
                const milestone = await this.prisma.milestone.findUnique({
                    where: { id: dto.milestoneId },
                });

                if (!milestone) {
                    throw new NotFoundException('Milestone not found');
                }

                // Check if milestone already has an invoice
                if (milestone.invoiceDate) {
                    throw new BadRequestException('Milestone already has an invoice');
                }
            }

            // Retry logic for unique invoice number generation
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries) {
                try {
                    // Generate invoice number
                    const invoiceNumber = await this.generateInvoiceNumber();

                    // Calculate tax breakdown from tax-inclusive amount
                    // dto.amount is the tax-inclusive total from milestone
                    const taxBreakdown = this.calculateTaxBreakdown(dto.amount, dto.type);
                    const totalAmount = dto.amount; // Tax-inclusive total
                    const amountBeforeTax = taxBreakdown.amountBeforeTax;
                    const taxAmount = taxBreakdown.taxAmount;
                    const taxRate = taxBreakdown.taxRate;

                    // Create invoice
                    // Use transaction to ensure consistency
                    const result = await this.prisma.$transaction(async (tx) => {
                        // Create invoice
                        const invoice = await tx.invoice.create({
                            data: {
                                invoiceNumber,
                                contractId: dto.contractId,
                                projectId: dto.projectId,
                                milestoneId: dto.milestoneId,
                                invoiceDate: new Date(dto.invoiceDate),
                                dueDate: new Date(dto.dueDate),
                                amount: amountBeforeTax, // Tax-exclusive amount
                                taxRate,
                                taxAmount,
                                totalAmount, // Tax-inclusive amount (equals milestone amount)
                                type: dto.type,
                                status: InvoiceStatus.Draft,
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

                        // If linked to milestone, update milestone invoice date
                        if (dto.milestoneId) {
                            await tx.milestone.update({
                                where: { id: dto.milestoneId },
                                data: {
                                    invoiceDate: new Date(dto.invoiceDate),
                                    status: MilestoneStatus.Invoiced,
                                },
                            });
                        }

                        return invoice;
                    });

                    return result; // Success, return immediately

                } catch (error) {
                    // Check for Prisma unique constraint violation code (P2002)
                    if (error.code === 'P2002' && error.meta?.target?.includes('invoiceNumber')) {
                        retryCount++;
                        console.warn(`Invoice number collision detected. Retrying... (${retryCount}/${maxRetries})`);
                        // Short delay to allow other transaction to settle
                        await new Promise(resolve => setTimeout(resolve, 100));
                        continue;
                    }
                    throw error; // Rethrow other errors
                }
            }

            throw new BadRequestException('Failed to generate unique invoice number after multiple retries. Please try again.');

        } catch (error) {
            console.error("Create Invoice Error:", error);
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException(`Failed to create invoice: ${error.message}`);
        }
    }

    async findOneMilestone(id: string) {
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

    /**
     * Create invoice from milestone
     */
    async createInvoiceFromMilestone(milestoneId: string, dto: Partial<CreateInvoiceDto>) {
        const milestone = await this.prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: {
                contract: {
                    include: { project: true } // Include project to get ID
                },
            },
        });

        if (!milestone) {
            throw new NotFoundException('Milestone not found');
        }

        // Allow invoicing for Pending/WIP (e.g. Advance Payment) - removed strict check
        // if (milestone.status !== MilestoneStatus.Verified && milestone.status !== MilestoneStatus.Ready_to_Invoice) {
        //     throw new BadRequestException('Milestone must be verified before creating invoice');
        // }

        if (milestone.invoiceDate) {
            throw new BadRequestException('Milestone already has an invoice');
        }

        const invoiceDto: CreateInvoiceDto = {
            contractId: milestone.contractId,
            projectId: milestone.contract?.project?.id, // Link to project
            milestoneId: milestone.id,
            amount: Number(milestone.amount),
            invoiceDate: dto.invoiceDate || new Date().toISOString(),
            dueDate: dto.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            type: dto.type || InvoiceType.Service,
            description: dto.description || `Invoice for milestone: ${milestone.name}`,
            remarks: dto.remarks,
        };

        return this.createInvoice(invoiceDto);
    }

    /**
     * Get all invoices
     */
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

    /**
     * Get invoice by ID
     */
    async findOne(id: string) {
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
            throw new NotFoundException('Invoice not found');
        }

        return invoice;
    }

    /**
     * Update invoice status
     */
    async updateStatus(id: string, status: InvoiceStatus) {
        const invoice = await this.findOne(id);

        return this.prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }

    /**
     * Update invoice (remarks, description, etc.)
     */
    async updateInvoice(id: string, updateData: Partial<{ remarks: string; description: string }>) {
        const invoice = await this.findOne(id);

        return this.prisma.invoice.update({
            where: { id },
            data: updateData,
        });
    }

    /**
     * Void/Cancel invoice
     */
    async voidInvoice(id: string, reason?: string) {
        const invoice = await this.findOne(id);

        // Check if invoice can be voided
        if (invoice.status === InvoiceStatus.Cancelled) {
            throw new BadRequestException('Invoice is already cancelled');
        }

        if (invoice.status === InvoiceStatus.Paid) {
            throw new BadRequestException('Cannot void a paid invoice. Please process refund first.');
        }

        // If invoice has partial payments, warn user
        const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        if (totalPaid > 0) {
            throw new BadRequestException('Cannot void invoice with payments. Please handle refunds first.');
        }

        // Update invoice status to Cancelled and clear milestone reference
        const voidedInvoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                status: InvoiceStatus.Cancelled,
                remarks: reason ? `${invoice.remarks || ''}\n[作废原因] ${reason}`.trim() : invoice.remarks,
                milestoneId: null, // Clear milestone reference to allow re-invoicing
            },
        });

        // If invoice is linked to a milestone, restore milestone status
        if (invoice.milestoneId) {
            await this.prisma.milestone.update({
                where: { id: invoice.milestoneId },
                data: {
                    invoiceDate: null,
                    status: MilestoneStatus.Verified, // Restore to verified status
                },
            });
        }

        return voidedInvoice;
    }

    /**
     * Create payment record
     */
    async createPayment(dto: CreatePaymentDto) {
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

        if (!invoice) throw new NotFoundException('Invoice not found');

        // Generate payment number
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

        // Create payment
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

        // Calculate total payments for this invoice
        const totalPayments = await this.prisma.payment.aggregate({
            where: { invoiceId: dto.invoiceId },
            _sum: { amount: true },
        });

        const totalPaid = totalPayments._sum.amount || 0;

        // Update invoice status
        let newStatus = invoice.status;
        if (totalPaid >= invoice.totalAmount) {
            newStatus = InvoiceStatus.Paid;

            // Update milestone status if linked
            if (invoice.milestoneId) {
                await this.prisma.milestone.update({
                    where: { id: invoice.milestoneId },
                    data: {
                        paymentDate: new Date(dto.paymentDate),
                        status: MilestoneStatus.Paid,
                    },
                });
            }
        } else if (totalPaid > 0) {
            newStatus = InvoiceStatus.PartiallyPaid;
        }

        if (newStatus !== invoice.status) {
            await this.updateStatus(dto.invoiceId, newStatus);
        }

        // Create Fund Transaction for Project Financials
        await this.createFundTransactionForPayment(invoice, payment);

        return payment;
    }

    private async createFundTransactionForPayment(invoice: any, payment: any) {
        if (!invoice.projectId) return;

        try {
            await this.prisma.fundTransaction.create({
                data: {
                    projectId: invoice.projectId,
                    type: FundTransactionType.SIMPLE_PASS,
                    status: FundTransactionStatus.COMPLETED,
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
        } catch (error) {
            console.error('Failed to create fund transaction for payment', error);
            // Don't block the payment response
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
            if (!payment.invoice.projectId) continue;

            // Check if transaction exists (rough heuristic match)
            const existing = await this.prisma.fundTransaction.findFirst({
                where: {
                    projectId: payment.invoice.projectId,
                    totalAmount: payment.amount,
                    transactionDate: payment.paymentDate,
                    type: FundTransactionType.SIMPLE_PASS
                }
            });

            if (!existing) {
                await this.createFundTransactionForPayment(payment.invoice, payment);
                syncedCount++;
            }
        }
        return { message: `Synced ${syncedCount} transactions` };
    }

    /**
     * Get dashboard data
     */
    async getDashboardData() {
        // Get all invoices
        const invoices = await this.prisma.invoice.findMany({
            include: {
                payments: true,
                milestone: true,
            },
        });

        // Calculate KPIs
        let pendingInvoiceAmount = 0;
        let outstandingAmount = 0;
        let paidAmount = 0;

        for (const invoice of invoices) {
            const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

            if (invoice.status === InvoiceStatus.Draft) {
                // Not counted
            } else if (invoice.status === InvoiceStatus.Paid) {
                paidAmount += invoice.totalAmount;
            } else {
                outstandingAmount += (invoice.totalAmount - totalPaid);
            }
        }

        // Get milestones ready to invoice
        const readyToInvoiceMilestones = await this.prisma.milestone.findMany({
            where: {
                status: {
                    in: [MilestoneStatus.Verified, MilestoneStatus.Ready_to_Invoice],
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

        const pendingInvoiceAmountFromMilestones = readyToInvoiceMilestones.reduce(
            (sum, m) => sum + Number(m.amount),
            0
        );

        // --- New Analytics ---

        // 1. Aging Analysis
        const agingAnalysis = {
            notDue: 0,
            overdue30: 0,
            overdue90: 0,
            overdueMore: 0,
        };

        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;

        for (const invoice of invoices) {
            // Only consider unpaid/partial
            if (invoice.status === InvoiceStatus.Issued || invoice.status === InvoiceStatus.PartiallyPaid || invoice.status === InvoiceStatus.Overdue) {
                const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
                const remaining = invoice.totalAmount - totalPaid;
                const dueDate = new Date(invoice.dueDate);
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / oneDay);

                if (diffDays <= 0) {
                    agingAnalysis.notDue += remaining;
                } else if (diffDays <= 30) {
                    agingAnalysis.overdue30 += remaining;
                } else if (diffDays <= 90) {
                    agingAnalysis.overdue90 += remaining;
                } else {
                    agingAnalysis.overdueMore += remaining;
                }
            }
        }

        // 2. Project Financial Health
        // 2. Project Financial Health
        const projectHealth: ProjectHealthMetric[] = [];
        const projects = await this.prisma.project.findMany({
            include: {
                contract: true, // Should include contract to get ID/Number
                invoices: {
                    include: { payments: true }
                },
                fundTransactions: true // Include fund transactions for cost calculation
            }
        });

        // Need to fetch milestones for projects to see blockers
        // The schema has Project <-> Contract 1:1.

        for (const project of projects) {
            // Revenue (Contract Value)
            // Use wonPrice if available (Project Detail Page logic), otherwise totalContractValue
            const contractValue = Number(project.contract?.wonPrice || project.contract?.totalContractValue || 0);

            // Invoiced & Paid
            let billedAmount = 0;
            let collectedAmount = 0;

            // Note: Invoices are linked to Contract, and optionally Project.
            // But strict Project Financials should probably look at Contract's invoices if 1:1.
            // Let's use project.contract.invoices if available, but here we only loaded project.invoices.
            // Better to load via contract to be safe if invoices are linked to contract primarily.

            // Re-fetch invoices for this project's contract to be accurate
            const contractInvoices = await this.prisma.invoice.findMany({
                where: { contractId: project.contractId },
                include: { payments: true }
            });

            for (const inv of contractInvoices) {
                if (inv.status !== InvoiceStatus.Cancelled && inv.status !== InvoiceStatus.Draft) {
                    billedAmount += inv.totalAmount;
                    collectedAmount += inv.payments.reduce((sum, p) => sum + p.amount, 0);
                }
            }

            // Costs
            // Fund Transactions (e.g. Advances)
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

            // Milestones Status
            const milestones = await this.prisma.milestone.findMany({
                where: { contractId: project.contractId }
            });

            const blockerCount = milestones.filter(m => m.status === MilestoneStatus.Verified).length; // Ready to invoice but not invoiced

            projectHealth.push({
                id: project.id,
                // Wait, Project schema has NO name field! It relies on Contract or Description? 
                // Ah, check schema: model Project { ... description String? ... }
                // We should use Contract Opportunity Customer CompanyName + Contract Number usually.
                displayName: project.contract ? `${project.contract.contractNumber}` : 'Unnamed Project',
                customerName: 'Loading...', // Ideally we include this in query
                contractValue,
                billedAmount,
                collectedAmount,
                totalCost,
                grossMargin,
                profitMargin,
                blockerCount // Verified milestones waiting for invoice
            });
        }

        // Enhance project names with customer
        const enrichedProjects = await Promise.all(projectHealth.map(async (p) => {
            const contractId = projects.find(proj => proj.id === p.id)?.contractId;
            if (!contractId) return p;

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

    /**
     * Milestone Template Management
     */
    async createMilestoneTemplate(data: { name: string; description?: string; milestones: string; isActive?: boolean }) {
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

    async findOneTemplate(id: string) {
        const template = await this.prisma.milestoneTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException('Template not found');
        }

        return template;
    }

    async updateTemplate(id: string, data: Partial<{ name: string; description?: string; milestones: string; isActive: boolean }>) {
        await this.findOneTemplate(id);

        return this.prisma.milestoneTemplate.update({
            where: { id },
            data,
        });
    }

    async deleteTemplate(id: string) {
        await this.findOneTemplate(id);

        return this.prisma.milestoneTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async uploadReceipt(id: string, file: any) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });
        if (!invoice) throw new NotFoundException('Invoice not found');

        return this.prisma.invoice.update({
            where: { id },
            data: {
                filePath: file.path,
                fileName: file.filename,
            },
        });
    }

    async uploadPaymentReceipt(id: string, file: any) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment) throw new NotFoundException('Payment not found');

        return this.prisma.payment.update({
            where: { id },
            data: {
                filePath: file.path,
                fileName: file.filename,
            },
        });
    }
}
