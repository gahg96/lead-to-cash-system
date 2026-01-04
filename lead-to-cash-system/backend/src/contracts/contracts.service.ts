import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractStatus, LineItemType, MilestoneStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
    constructor(private prisma: PrismaService) { }

    async create(createContractDto: CreateContractDto, userId: string) {
        try {
            console.log('[ContractsService] Creating contract with DTO:', JSON.stringify(createContractDto, null, 2));
            console.log('[ContractsService] User ID:', userId);

            // Fetch opportunity with related data
            const opportunity = await this.prisma.opportunity.findUnique({
                where: { id: createContractDto.opportunityId },
                include: {
                    customer: true,
                    vendors: true,
                    procurements: {
                        include: {
                            lineItems: {
                                orderBy: { sortOrder: 'asc' }
                            }
                        },
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            console.log('[ContractsService] Opportunity found:', opportunity ? 'Yes' : 'No');
            if (!opportunity) {
                throw new Error('Opportunity not found');
            }

            // Find won procurement or use the latest one
            const wonProcurement = opportunity.procurements.find(p => p.status === 'Won')
                || opportunity.procurements[0];

            console.log('[ContractsService] Won procurement:', wonProcurement ? 'Found' : 'Not found');
            console.log('[ContractsService] Line items count:', wonProcurement?.lineItems?.length || 0);

            // Determine contract value: use wonPrice from procurement, or estimatedValue from opportunity
            const totalContractValue = createContractDto.totalContractValue
                || (wonProcurement?.wonPrice ? Number(wonProcurement.wonPrice) : 0)
                || (opportunity.estimatedValue ? Number(opportunity.estimatedValue) : 0);

            console.log('[ContractsService] Total contract value:', totalContractValue);

            // Get primary vendor (first one if multiple)
            const primaryVendor = opportunity.vendors && opportunity.vendors.length > 0
                ? opportunity.vendors[0]
                : null;

            console.log('[ContractsService] Primary vendor:', primaryVendor ? primaryVendor.name : 'None');

            // Check if user exists before assigning as drafter
            const userExists = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            console.log('[ContractsService] User exists:', userExists ? 'Yes' : 'No');

            // Helper function to determine tax rate based on item type
            const getTaxRate = (type: string): number => {
                const typeUpper = type.toUpperCase();
                if (typeUpper.includes('PRODUCT') || typeUpper.includes('产品')) return 0.13;
                if (typeUpper.includes('SERVICE') || typeUpper.includes('服务')) return 0.06;
                return 0;
            };

            // Helper function to map procurement type to LineItemType enum
            const mapToLineItemType = (type: string): LineItemType => {
                const typeUpper = type.toUpperCase();
                if (typeUpper.includes('PRODUCT') || typeUpper.includes('产品')) return LineItemType.PRODUCT;
                return LineItemType.SERVICE;
            };

            console.log('[ContractsService] About to create contract in database...');

            // Create contract with line items
            const contract = await this.prisma.contract.create({
                data: {
                    ...createContractDto,
                    totalContractValue,
                    // Pricing information - safely handle undefined/null
                    wonPrice: wonProcurement?.wonPrice != null ? Number(wonProcurement.wonPrice) : null,
                    estimatedValue: opportunity.estimatedValue != null ? Number(opportunity.estimatedValue) : null,
                    // Customer contact information
                    customerContactName: opportunity.customer?.contactName,
                    customerContactPhone: opportunity.customer?.contactPhone,
                    customerContactEmail: opportunity.customer?.contactEmail,
                    customerContactTitle: opportunity.customer?.contactTitle,
                    // Vendor contact information
                    vendorName: primaryVendor?.name,
                    vendorContactName: primaryVendor?.contactName,
                    vendorContactPhone: primaryVendor?.contactPhone,
                    status: ContractStatus.Draft,
                    // Only set drafterId if user exists in database
                    ...(userExists ? { drafterId: userId } : {}),
                    // Create line items from procurement if available
                    lineItems: wonProcurement?.lineItems?.length > 0 ? {
                        create: wonProcurement.lineItems.map((item, index) => {
                            const quantity = 1;
                            const taxRate = getTaxRate(item.type);
                            const totalAmount = Number(item.amount);

                            // Calculate backwards from total amount
                            // totalAmount = subtotal + taxAmount
                            // totalAmount = subtotal + (subtotal * taxRate)
                            // totalAmount = subtotal * (1 + taxRate)
                            const subtotal = totalAmount / (1 + taxRate);
                            const taxAmount = subtotal * taxRate;
                            const unitPrice = subtotal / quantity;

                            return {
                                itemName: item.name,
                                itemType: mapToLineItemType(item.type),
                                description: item.description,
                                quantity,
                                unitPrice,
                                taxRate,
                                subtotal,
                                taxAmount,
                                totalAmount,
                                sortOrder: item.sortOrder || index
                            };
                        })
                    } : undefined
                },
                include: {
                    drafter: true,
                    opportunity: {
                        include: {
                            customer: true
                        }
                    },
                    lineItems: true
                },
            });

            console.log('[ContractsService] Contract created successfully:', contract.id);
            return contract;
        } catch (error) {
            console.error('[ContractsService] ERROR creating contract:', error);
            console.error('[ContractsService] Error stack:', error.stack);
            console.error('[ContractsService] Error message:', error.message);
            throw error;
        }
    }

    findAll() {
        return this.prisma.contract.findMany({
            include: {
                opportunity: {
                    include: { customer: true }
                },
                drafter: true,
                approver: true,
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    findOne(id: string) {
        return this.prisma.contract.findUnique({
            where: { id },
            include: {
                opportunity: { include: { customer: true } },
                milestones: { orderBy: { createdAt: 'asc' } },
                documents: { include: { uploadedBy: true }, orderBy: { createdAt: 'desc' } },
                lineItems: { orderBy: { sortOrder: 'asc' } },
                drafter: true,
                approver: true,
                project: {
                    include: {
                        fundTransactions: {
                            include: {
                                collections: true,
                                allocations: true
                            }
                        }
                    }
                },
            },
        });
    }

    update(id: string, updateContractDto: UpdateContractDto) {
        return this.prisma.contract.update({
            where: { id },
            data: updateContractDto,
        });
    }

    // Approval Workflow Actions
    async submitForCustomerReview(id: string) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: ContractStatus.CustomerReview },
        });
    }

    async passCustomerReview(id: string) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: ContractStatus.InternalReview },
        });
    }

    async passInternalReview(id: string) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: ContractStatus.CustomerSeal },
        });
    }

    async customerSeal(id: string) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: ContractStatus.InternalSeal },
        });
    }

    async internalSeal(id: string) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: ContractStatus.Signed },
        });
    }

    // Keep reject for general rejection at any stage? Or maybe limit it.
    async reject(id: string, approverId: string) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: ContractStatus.Draft }, // Reset to draft on "rejection" for now
        });
    }

    async forceUpdateStatus(id: string, status: ContractStatus) {
        return this.prisma.contract.update({
            where: { id },
            data: { status },
        });
    }

    // Document Management
    async addDocument(contractId: string, file: any, userId: string) {
        return this.prisma.contractDocument.create({
            data: {
                contractId,
                filename: file.filename, // Using the decoded/processed filename
                filepath: file.path, // Multer uses .path
                mimetype: file.mimetype,
                size: file.size,
                uploadedById: userId,
            },
        });
    }


    // Milestone Management
    async addMilestone(contractId: string, data: any) {
        // Get contract to check total value
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: true },
        });

        if (!contract) {
            throw new Error('Contract not found');
        }

        const newAmount = data.amount ? parseFloat(data.amount) : 0;

        // Calculate total milestone amount including the new one
        const existingTotal = contract.milestones.reduce(
            (sum, m) => sum + Number(m.amount),
            0
        );
        const newTotal = existingTotal + newAmount;

        // Validate total doesn't exceed contract value
        if (newTotal > Number(contract.totalContractValue)) {
            throw new Error(
                `里程碑总金额 (¥${newTotal.toLocaleString()}) 超过合同金额 (¥${Number(contract.totalContractValue).toLocaleString()})`
            );
        }

        const milestoneData = { ...data };
        if (milestoneData.dueDate && typeof milestoneData.dueDate === 'string') {
            milestoneData.dueDate = new Date(milestoneData.dueDate);
        }
        return this.prisma.milestone.create({
            data: {
                contractId,
                ...milestoneData,
                amount: newAmount,
            },
        });
    }

    async initializeDefaultMilestones(id: string) {
        const milestones = [
            { name: '合同签订', amount: 0, status: MilestoneStatus.Pending },
            { name: '项目初验', amount: 0, status: MilestoneStatus.Pending },
            { name: '项目终验', amount: 0, status: MilestoneStatus.Pending }
        ];

        // Create milestones sequentially
        for (const m of milestones) {
            await this.prisma.milestone.create({
                data: {
                    contractId: id,
                    name: m.name,
                    amount: m.amount ?? 0,
                    status: m.status
                }
            });
        }

        return this.findOne(id);
    }

    async updateMilestone(id: string, data: any) {
        // Get milestone and contract to check total value
        const milestone = await this.prisma.milestone.findUnique({
            where: { id },
            include: {
                contract: {
                    include: { milestones: true },
                },
            },
        });

        if (!milestone) {
            throw new Error('Milestone not found');
        }

        const updateData = { ...data };
        const newAmount = updateData.amount ? parseFloat(updateData.amount) : Number(milestone.amount);

        // Calculate total milestone amount with the updated value
        const totalWithoutCurrent = milestone.contract.milestones
            .filter(m => m.id !== id)
            .reduce((sum, m) => sum + Number(m.amount), 0);
        const newTotal = totalWithoutCurrent + newAmount;

        // Validate total doesn't exceed contract value
        if (newTotal > Number(milestone.contract.totalContractValue)) {
            throw new Error(
                `里程碑总金额 (¥${newTotal.toLocaleString()}) 超过合同金额 (¥${Number(milestone.contract.totalContractValue).toLocaleString()})`
            );
        }

        if (updateData.amount) {
            updateData.amount = newAmount;
        }
        if (updateData.dueDate && typeof updateData.dueDate === 'string') {
            updateData.dueDate = new Date(updateData.dueDate);
        }
        return this.prisma.milestone.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteMilestone(id: string) {
        return this.prisma.milestone.delete({
            where: { id },
        });
    }

    async remove(id: string) {
        return this.prisma.$transaction(async (tx) => {
            // 1. Delete Dependencies that don't cascade automatically

            // Delete Milestones
            await tx.milestone.deleteMany({
                where: { contractId: id },
            });

            // Handle Project dependencies (FundTransaction)
            const projects = await tx.project.findMany({
                where: { contractId: id },
                select: { id: true }
            });

            if (projects.length > 0) {
                const projectIds = projects.map(p => p.id);
                // Unlink FundTransactions (Set Project to null)
                await tx.fundTransaction.updateMany({
                    where: { projectId: { in: projectIds } },
                    data: { projectId: null }
                });

                // Now safe to delete Projects (other children cascade)
                await tx.project.deleteMany({
                    where: { contractId: id },
                });
            }

            // 2. Delete Contract (will cascade to Documents, LineItems, Invoices)
            return tx.contract.delete({
                where: { id },
            });
        });
    }
}

