import { Module } from '@nestjs/common';
import { PaymentAccountsService } from './payment-accounts.service';
import { PaymentAccountsController } from './payment-accounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentAccountsController],
  providers: [PaymentAccountsService],
  exports: [PaymentAccountsService]
})
export class PaymentAccountsModule { }
