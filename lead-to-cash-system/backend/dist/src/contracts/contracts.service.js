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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ContractsService = class ContractsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createContractDto, userId) {
        try {
            console.log('[ContractsService] Creating contract with DTO:', JSON.stringify(createContractDto, null, 2));
            console.log('[ContractsService] User ID:', userId);
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
            const wonProcurement = opportunity.procurements.find(p => p.status === 'Won')
                || opportunity.procurements[0];
            console.log('[ContractsService] Won procurement:', wonProcurement ? 'Found' : 'Not found');
            console.log('[ContractsService] Line items count:', wonProcurement?.lineItems?.length || 0);
            const totalContractValue = createContractDto.totalContractValue
                || (wonProcurement?.wonPrice ? Number(wonProcurement.wonPrice) : 0)
                || (opportunity.estimatedValue ? Number(opportunity.estimatedValue) : 0);
            console.log('[ContractsService] Total contract value:', totalContractValue);
            const primaryVendor = opportunity.vendors && opportunity.vendors.length > 0
                ? opportunity.vendors[0]
                : null;
            console.log('[ContractsService] Primary vendor:', primaryVendor ? primaryVendor.name : 'None');
            const userExists = await this.prisma.user.findUnique({
                where: { id: userId }
            });
            console.log('[ContractsService] User exists:', userExists ? 'Yes' : 'No');
            const getTaxRate = (type) => {
                const typeUpper = type.toUpperCase();
                if (typeUpper.includes('PRODUCT') || typeUpper.includes('产品'))
                    return 0.13;
                if (typeUpper.includes('SERVICE') || typeUpper.includes('服务'))
                    return 0.06;
                return 0;
            };
            const mapToLineItemType = (type) => {
                const typeUpper = type.toUpperCase();
                if (typeUpper.includes('PRODUCT') || typeUpper.includes('产品'))
                    return client_1.LineItemType.PRODUCT;
                return client_1.LineItemType.SERVICE;
            };
            console.log('[ContractsService] About to create contract in database...');
            const contract = await this.prisma.contract.create({
                data: {
                    ...createContractDto,
                    totalContractValue,
                    wonPrice: wonProcurement?.wonPrice != null ? Number(wonProcurement.wonPrice) : null,
                    estimatedValue: opportunity.estimatedValue != null ? Number(opportunity.estimatedValue) : null,
                    customerContactName: opportunity.customer?.contactName,
                    customerContactPhone: opportunity.customer?.contactPhone,
                    customerContactEmail: opportunity.customer?.contactEmail,
                    customerContactTitle: opportunity.customer?.contactTitle,
                    vendorName: primaryVendor?.name,
                    vendorContactName: primaryVendor?.contactName,
                    vendorContactPhone: primaryVendor?.contactPhone,
                    status: client_1.ContractStatus.Draft,
                    ...(userExists ? { drafterId: userId } : {}),
                    lineItems: wonProcurement?.lineItems?.length > 0 ? {
                        create: wonProcurement.lineItems.map((item, index) => {
                            const quantity = 1;
                            const taxRate = getTaxRate(item.type);
                            const totalAmount = Number(item.amount);
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
        }
        catch (error) {
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
    findOne(id) {
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
    update(id, updateContractDto) {
        return this.prisma.contract.update({
            where: { id },
            data: updateContractDto,
        });
    }
    async submitForCustomerReview(id) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: client_1.ContractStatus.CustomerReview },
        });
    }
    async passCustomerReview(id) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: client_1.ContractStatus.InternalReview },
        });
    }
    async passInternalReview(id) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: client_1.ContractStatus.CustomerSeal },
        });
    }
    async customerSeal(id) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: client_1.ContractStatus.InternalSeal },
        });
    }
    async internalSeal(id) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: client_1.ContractStatus.Signed },
        });
    }
    async reject(id, approverId) {
        return this.prisma.contract.update({
            where: { id },
            data: { status: client_1.ContractStatus.Draft },
        });
    }
    async forceUpdateStatus(id, status) {
        return this.prisma.contract.update({
            where: { id },
            data: { status },
        });
    }
    async addDocument(contractId, file, userId) {
        return this.prisma.contractDocument.create({
            data: {
                contractId,
                filename: file.filename,
                filepath: file.path,
                mimetype: file.mimetype,
                size: file.size,
                uploadedById: userId,
            },
        });
    }
    async addMilestone(contractId, data) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: { milestones: true },
        });
        if (!contract) {
            throw new Error('Contract not found');
        }
        const newAmount = data.amount ? parseFloat(data.amount) : 0;
        const existingTotal = contract.milestones.reduce((sum, m) => sum + Number(m.amount), 0);
        const newTotal = existingTotal + newAmount;
        if (newTotal > Number(contract.totalContractValue)) {
            throw new Error(`里程碑总金额 (¥${newTotal.toLocaleString()}) 超过合同金额 (¥${Number(contract.totalContractValue).toLocaleString()})`);
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
    async initializeDefaultMilestones(id) {
        const milestones = [
            { name: '合同签订', amount: 0, status: client_1.MilestoneStatus.Pending },
            { name: '项目初验', amount: 0, status: client_1.MilestoneStatus.Pending },
            { name: '项目终验', amount: 0, status: client_1.MilestoneStatus.Pending }
        ];
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
    async updateMilestone(id, data) {
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
        const totalWithoutCurrent = milestone.contract.milestones
            .filter(m => m.id !== id)
            .reduce((sum, m) => sum + Number(m.amount), 0);
        const newTotal = totalWithoutCurrent + newAmount;
        if (newTotal > Number(milestone.contract.totalContractValue)) {
            throw new Error(`里程碑总金额 (¥${newTotal.toLocaleString()}) 超过合同金额 (¥${Number(milestone.contract.totalContractValue).toLocaleString()})`);
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
    async deleteMilestone(id) {
        return this.prisma.milestone.delete({
            where: { id },
        });
    }
    async remove(id) {
        return this.prisma.$transaction(async (tx) => {
            await tx.milestone.deleteMany({
                where: { contractId: id },
            });
            const projects = await tx.project.findMany({
                where: { contractId: id },
                select: { id: true }
            });
            if (projects.length > 0) {
                const projectIds = projects.map(p => p.id);
                await tx.fundTransaction.updateMany({
                    where: { projectId: { in: projectIds } },
                    data: { projectId: null }
                });
                await tx.project.deleteMany({
                    where: { contractId: id },
                });
            }
            return tx.contract.delete({
                where: { id },
            });
        });
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map