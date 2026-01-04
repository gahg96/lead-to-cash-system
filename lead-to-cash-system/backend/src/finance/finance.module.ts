import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PrismaModule } from '../prisma/prisma.module';

import { FundController } from './fund.controller';
import { FundService } from './fund.service';

@Module({
    imports: [PrismaModule],
    controllers: [FinanceController, FundController],
    providers: [FinanceService, FundService],
    exports: [FinanceService, FundService],
})
export class FinanceModule { }
