import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentAccountsService } from './payment-accounts.service';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';

@Controller('payment-accounts')
export class PaymentAccountsController {
  constructor(private readonly paymentAccountsService: PaymentAccountsService) { }

  @Post()
  create(@Body() createDto: CreatePaymentAccountDto) {
    return this.paymentAccountsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.paymentAccountsService.findAll();
  }

  @Get('active')
  getActive() {
    return this.paymentAccountsService.getActive();
  }

  @Get('default')
  getDefault() {
    return this.paymentAccountsService.getDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentAccountsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePaymentAccountDto) {
    return this.paymentAccountsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentAccountsService.remove(id);
  }
}
