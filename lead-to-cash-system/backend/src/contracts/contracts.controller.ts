import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContractStatus } from '@prisma/client';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
    constructor(private readonly contractsService: ContractsService) {
        // Ensure upload directory exists
        const fs = require('fs');
        if (!fs.existsSync('./uploads/contracts')) {
            fs.mkdirSync('./uploads/contracts', { recursive: true });
        }
    }

    @Post()
    async create(@Body() createContractDto: CreateContractDto, @Request() req) {
        try {
            console.log('[ContractsController] Received create request');
            console.log('[ContractsController] DTO:', JSON.stringify(createContractDto, null, 2));
            console.log('[ContractsController] User:', req.user);

            const result = await this.contractsService.create(createContractDto, req.user.userId);

            console.log('[ContractsController] Contract created successfully');
            return result;
        } catch (error) {
            console.error('[ContractsController] ERROR:', error.message);
            console.error('[ContractsController] Stack:', error.stack);
            throw error;
        }
    }

    @Get()
    findAll() {
        return this.contractsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.contractsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
        return this.contractsService.update(id, updateContractDto);
    }

    // Approval Workflow Endpoints - Updated
    @Post(':id/submit-customer')
    submitCustomer(@Param('id') id: string) {
        return this.contractsService.submitForCustomerReview(id);
    }

    @Post(':id/pass-customer')
    passCustomer(@Param('id') id: string) {
        return this.contractsService.passCustomerReview(id);
    }

    @Post(':id/pass-internal')
    passInternal(@Param('id') id: string) {
        return this.contractsService.passInternalReview(id);
    }

    @Post(':id/customer-seal')
    customerSeal(@Param('id') id: string) {
        return this.contractsService.customerSeal(id);
    }

    @Post(':id/internal-seal')
    internalSeal(@Param('id') id: string) {
        return this.contractsService.internalSeal(id);
    }

    @Patch(':id/status')
    forceUpdateStatus(@Param('id') id: string, @Body('status') status: ContractStatus) {
        return this.contractsService.forceUpdateStatus(id, status);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.contractsService.remove(id);
    }

    // Document Upload
    @Post(':id/documents')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/contracts',
            filename: (req, file, cb) => {
                // Generates a random filename to avoid conflicts and encoding issues
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, uniqueSuffix + extname(file.originalname));
            },
        }),
    }))
    async uploadDocument(
        @Param('id') contractId: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req,
    ) {
        // Handle potentially missing file
        if (!file) {
            throw new Error("File upload failed");
        }

        // Decode Chinese filename properly for display
        const decodedFilename = Buffer.from(file.originalname, 'latin1').toString('utf8');

        return this.contractsService.addDocument(contractId, {
            ...file,
            filename: decodedFilename,
        }, req.user.userId);
    }

    // Milestones
    @Post(':id/milestones')
    addMilestone(@Param('id') id: string, @Body() data: any) {
        return this.contractsService.addMilestone(id, data);
    }

    @Patch('milestones/:mid')
    updateMilestone(@Param('mid') mid: string, @Body() data: any) {
        return this.contractsService.updateMilestone(mid, data);
    }

    @Post(':id/milestones/defaults')
    initializeDefaultMilestones(@Param('id') id: string) {
        return this.contractsService.initializeDefaultMilestones(id);
    }

    @Delete('milestones/:mid')
    deleteMilestone(@Param('mid') mid: string) {
        return this.contractsService.deleteMilestone(mid);
    }
}

