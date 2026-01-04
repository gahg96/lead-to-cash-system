
import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { FundService } from './fund.service';
import { FundTransactionType } from '@prisma/client';

@Controller('funds')
export class FundController {
    constructor(private readonly fundService: FundService) { }

    @Post('transactions')
    async createTransaction(@Body() body: any) {
        // Basic DTO validation would go here or use a class
        return this.fundService.createTransaction({
            projectId: body.projectId,
            type: body.type as FundTransactionType,
            description: body.description,
            totalAmount: body.totalAmount,
            principalAmount: body.principalAmount,
            expectedDuration: body.expectedDuration,
            costRuleType: body.costRuleType,
            costRate: body.costRate,
            passThreshold: body.passThreshold,
            collections: body.collections,
            allocations: body.allocations,
            payouts: body.payouts,
            transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
            partyName: body.partyName,
        });
    }

    @Get('transactions')
    async getTransactions(@Query('projectId') projectId?: string) {
        return this.fundService.findAllTransactions(projectId);
    }

    @Get('transactions/:id')
    async getTransaction(@Param('id') id: string) {
        return this.fundService.calculateFinancials(id); // Return enriched details
    }

    @Post('allocations')
    async addAllocation(@Body() body: any) {
        return this.fundService.addAllocation(body.transactionId, {
            vendorName: body.vendorName,
            amount: body.amount,
            paymentDate: new Date(body.paymentDate),
        });
    }

    @Post('collections')
    async addCollection(@Body() body: any) {
        return this.fundService.addCollection(body.transactionId, {
            customerName: body.customerName,
            amount: body.amount,
            receivedDate: new Date(body.receivedDate),
        });
    }

    @Post('payouts')
    async addPayout(@Body() body: any) {
        return this.fundService.addPayout(body.transactionId, {
            beneficiary: body.beneficiary,
            baseAmount: body.baseAmount,
            payoutType: body.payoutType,
            conversionRate: body.conversionRate,
        });
    }

    @Post('transactions/:id')
    async updateTransaction(@Param('id') id: string, @Body() body: any) {
        return this.fundService.updateTransaction(id, {
            description: body.description,
            totalAmount: body.totalAmount,
            principalAmount: body.principalAmount,
            expectedDuration: body.expectedDuration,
            costRuleType: body.costRuleType,
            costRate: body.costRate,
            passThreshold: body.passThreshold,
            status: body.status,
            transactionDate: body.transactionDate ? new Date(body.transactionDate) : undefined,
            partyName: body.partyName,
        });
    }

    @Post('allocations/:id/delete')
    async deleteAllocation(@Param('id') id: string) {
        return this.fundService.deleteAllocation(id);
    }

    @Post('collections/:id/delete')
    async deleteCollection(@Param('id') id: string) {
        return this.fundService.deleteCollection(id);
    }

    @Post('payouts/:id/delete')
    async deletePayout(@Param('id') id: string) {
        return this.fundService.deletePayout(id);
    }

    @Get('transactions/:id/statement')
    async getStatement(@Param('id') id: string) {
        return this.fundService.generateStatement(id);
    }
}
