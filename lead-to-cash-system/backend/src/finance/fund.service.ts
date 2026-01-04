
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FundTransactionType, FundTransactionStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class FundService {
    constructor(private prisma: PrismaService) { }

    // --- Transactions ---

    async createTransaction(data: {
        projectId?: string;
        type: FundTransactionType;
        description?: string;
        totalAmount?: number;
        principalAmount?: number;
        expectedDuration?: number;
        costRuleType?: string;
        costRate?: number;
        passThreshold?: number;
        transactionDate?: Date;
        partyName?: string;
        collections?: Array<{
            customerName: string;
            amount: number;
            receivedDate: string | Date;
        }>;
        allocations?: Array<{
            vendorName: string;
            amount: number;
            paymentDate: string | Date;
        }>;
        payouts?: Array<{
            beneficiary: string;
            baseAmount: number;
            payoutType: string;
            conversionRate: number;
        }>;
    }) {
        // Validate contract amount constraint if projectId is provided
        if (data.projectId && data.totalAmount) {
            const project = await this.prisma.project.findUnique({
                where: { id: data.projectId },
                include: {
                    contract: true,
                    fundTransactions: true
                }
            });

            if (project && project.contract) {
                // Calculate total existing fund transactions
                const existingTotal = project.fundTransactions.reduce((sum, tx) => {
                    return sum + (tx.totalAmount ? Number(tx.totalAmount) : 0);
                }, 0);

                const newTotal = existingTotal + data.totalAmount;
                const contractValue = Number(project.contract.totalContractValue);

                if (newTotal > contractValue) {
                    throw new BadRequestException(
                        `资金交易总额 (¥${newTotal.toLocaleString()}) 不能超过合同金额 (¥${contractValue.toLocaleString()})。` +
                        `当前已使用: ¥${existingTotal.toLocaleString()}，剩余额度: ¥${(contractValue - existingTotal).toLocaleString()}`
                    );
                }
            }
        }

        // Use Prisma transaction to ensure atomicity
        return this.prisma.$transaction(async (tx) => {
            // Create the fund transaction
            const transaction = await tx.fundTransaction.create({
                data: {
                    projectId: data.projectId,
                    type: data.type,
                    description: data.description,
                    status: FundTransactionStatus.ACTIVE,
                    totalAmount: data.totalAmount ? new Prisma.Decimal(data.totalAmount) : new Prisma.Decimal(0),
                    principalAmount: data.principalAmount ? new Prisma.Decimal(data.principalAmount) : undefined,
                    expectedDuration: data.expectedDuration,
                    costRuleType: data.costRuleType,
                    costRate: data.costRate ? new Prisma.Decimal(data.costRate) : undefined,
                    passThreshold: data.passThreshold ? new Prisma.Decimal(data.passThreshold) : undefined,
                    transactionDate: data.transactionDate,
                    partyName: data.partyName,
                }
            });

            // Create collections if provided
            if (data.collections && data.collections.length > 0) {
                // Filter out invalid collections (missing required fields)
                const validCollections = data.collections.filter(c =>
                    c.customerName && c.amount && c.receivedDate
                );

                if (validCollections.length > 0) {
                    await tx.revenueCollection.createMany({
                        data: validCollections.map(c => ({
                            transactionId: transaction.id,
                            customerName: c.customerName,
                            amount: new Prisma.Decimal(c.amount),
                            receivedDate: new Date(c.receivedDate),
                        }))
                    });
                }
            }

            // Create allocations if provided
            if (data.allocations && data.allocations.length > 0) {
                // Filter out invalid allocations
                const validAllocations = data.allocations.filter(a =>
                    a.vendorName && a.amount && a.paymentDate
                );

                if (validAllocations.length > 0) {
                    await tx.capitalAllocation.createMany({
                        data: validAllocations.map(a => ({
                            transactionId: transaction.id,
                            vendorName: a.vendorName,
                            amount: new Prisma.Decimal(a.amount),
                            paymentDate: new Date(a.paymentDate),
                        }))
                    });
                }
            }

            // Create payouts if provided
            if (data.payouts && data.payouts.length > 0) {
                // Filter out invalid payouts
                const validPayouts = data.payouts.filter(p =>
                    p.beneficiary && p.baseAmount && p.payoutType && p.conversionRate
                );

                if (validPayouts.length > 0) {
                    await tx.expensePayout.createMany({
                        data: validPayouts.map(p => {
                            const base = new Prisma.Decimal(p.baseAmount);
                            const rate = new Prisma.Decimal(p.conversionRate);
                            return {
                                transactionId: transaction.id,
                                beneficiary: p.beneficiary,
                                baseAmount: base,
                                payoutType: p.payoutType,
                                conversionRate: rate,
                                netAmount: base.mul(rate),
                                status: 'PENDING',
                            };
                        })
                    });
                }
            }

            // Return the created transaction with all related data
            return tx.fundTransaction.findUnique({
                where: { id: transaction.id },
                include: {
                    project: true,
                    allocations: true,
                    collections: true,
                    payouts: true,
                }
            });
        });
    }

    async findAllTransactions(projectId?: string) {
        const where = projectId ? { projectId } : {};
        return this.prisma.fundTransaction.findMany({
            where,
            include: {
                project: true,
                allocations: true,
                collections: true,
                payouts: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findTransaction(id: string) {
        const transaction = await this.prisma.fundTransaction.findUnique({
            where: { id },
            include: {
                project: true,
                allocations: true,
                collections: true,
                payouts: true,
            }
        });

        if (!transaction) throw new NotFoundException('Transaction not found');
        return transaction;
    }

    // --- Allocations (Flow Out) ---

    async addAllocation(transactionId: string, data: { vendorName: string; amount: number; paymentDate: Date }) {
        return this.prisma.capitalAllocation.create({
            data: {
                transactionId,
                vendorName: data.vendorName,
                amount: new Prisma.Decimal(data.amount),
                paymentDate: data.paymentDate,
            }
        });
    }

    // --- Collections (Flow In) ---

    async addCollection(transactionId: string, data: { customerName: string; amount: number; receivedDate: Date }) {
        return this.prisma.revenueCollection.create({
            data: {
                transactionId,
                customerName: data.customerName,
                amount: new Prisma.Decimal(data.amount),
                receivedDate: data.receivedDate,
            }
        });
    }

    // --- Payouts (Expenses) ---

    async addPayout(transactionId: string, data: {
        beneficiary: string;
        baseAmount: number;
        payoutType: string;
        conversionRate: number;
    }) {
        const base = new Prisma.Decimal(data.baseAmount);
        const rate = new Prisma.Decimal(data.conversionRate);
        const net = base.mul(rate);

        return this.prisma.expensePayout.create({
            data: {
                transactionId,
                beneficiary: data.beneficiary,
                baseAmount: base,
                payoutType: data.payoutType,
                conversionRate: rate,
                netAmount: net,
                status: 'PENDING',
            }
        });
    }

    // --- Calculation Logic ---

    // This method calculates the complete financial snapshot for a transaction
    async calculateFinancials(id: string) {
        const tx = await this.findTransaction(id);

        let totalAllocated = new Prisma.Decimal(0);
        let totalCollected = new Prisma.Decimal(0);
        let totalPayoutsNet = new Prisma.Decimal(0);
        let totalInterestCost = new Prisma.Decimal(0);

        // Sum amounts
        tx.allocations.forEach(a => totalAllocated = totalAllocated.add(a.amount));
        tx.collections.forEach(c => totalCollected = totalCollected.add(c.amount));
        tx.payouts.forEach(p => totalPayoutsNet = totalPayoutsNet.add(p.netAmount));

        // Calculate Interest Cost for Allocations if type is ADVANCE
        if (tx.type === FundTransactionType.ADVANCE && tx.costRate) {
            const today = new Date();
            tx.allocations.forEach(a => {
                const durationMs = today.getTime() - new Date(a.paymentDate).getTime();
                const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
                const durationMonths = durationDays / 30; // Approximation

                let interest = new Prisma.Decimal(0);
                if (tx.costRuleType === 'MONTHLY' && tx.costRate) {
                    interest = a.amount.mul(tx.costRate).mul(durationMonths);
                } else if (tx.costRuleType === 'FIXED' && tx.costRate) {
                    interest = a.amount.mul(tx.costRate);
                }
                totalInterestCost = totalInterestCost.add(interest);
            });
        }

        const netMargin = totalCollected
            .sub(totalAllocated)
            .sub(totalInterestCost)
            .sub(totalPayoutsNet);

        return {
            transaction: tx,
            summary: {
                totalAllocated: totalAllocated.toNumber(),
                totalCollected: totalCollected.toNumber(),
                totalPayoutsNet: totalPayoutsNet.toNumber(),
                totalInterestCost: totalInterestCost.toNumber(),
                netMargin: netMargin.toNumber(),
            }
        };
    }

    async updateTransaction(id: string, data: {
        description?: string;
        totalAmount?: number;
        principalAmount?: number;
        expectedDuration?: number;
        costRuleType?: string;
        costRate?: number;
        passThreshold?: number;
        transactionDate?: Date;
        partyName?: string;
        status?: FundTransactionStatus;
    }) {
        return this.prisma.fundTransaction.update({
            where: { id },
            data: {
                description: data.description,
                totalAmount: data.totalAmount ? new Prisma.Decimal(data.totalAmount) : undefined,
                principalAmount: data.principalAmount ? new Prisma.Decimal(data.principalAmount) : undefined,
                expectedDuration: data.expectedDuration,
                costRuleType: data.costRuleType,
                costRate: data.costRate ? new Prisma.Decimal(data.costRate) : undefined,
                passThreshold: data.passThreshold ? new Prisma.Decimal(data.passThreshold) : undefined,
                transactionDate: data.transactionDate,
                partyName: data.partyName,
                status: data.status,
            }
        });
    }

    async deleteAllocation(id: string) {
        return this.prisma.capitalAllocation.delete({ where: { id } });
    }

    async deleteCollection(id: string) {
        return this.prisma.revenueCollection.delete({ where: { id } });
    }

    async deletePayout(id: string) {
        return this.prisma.expensePayout.delete({ where: { id } });
    }

    async generateStatement(id: string) {
        const financials = await this.calculateFinancials(id);
        const tx = financials.transaction;

        return {
            title: `Fund Transaction Statement - ${tx.description}`,
            date: new Date(),
            project: tx.project?.description || 'N/A',
            type: tx.type,
            details: {
                allocations: tx.allocations.map(a => ({
                    date: a.paymentDate,
                    vendor: a.vendorName,
                    amount: a.amount.toNumber()
                })),
                collections: tx.collections.map(c => ({
                    date: c.receivedDate,
                    customer: c.customerName,
                    amount: c.amount.toNumber()
                })),
                payouts: tx.payouts.map(p => ({
                    beneficiary: p.beneficiary,
                    baseAmount: p.baseAmount.toNumber(),
                    rate: p.conversionRate.toNumber(),
                    netAmount: p.netAmount.toNumber()
                }))
            },
            summary: financials.summary
        };
    }
}
