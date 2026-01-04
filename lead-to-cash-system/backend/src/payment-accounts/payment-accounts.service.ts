import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';

@Injectable()
export class PaymentAccountsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreatePaymentAccountDto) {
    // If this is set as default, unset all other defaults
    if (createDto.isDefault) {
      await this.prisma.paymentAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return this.prisma.paymentAccount.create({
      data: createDto
    });
  }

  findAll() {
    return this.prisma.paymentAccount.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  findOne(id: string) {
    return this.prisma.paymentAccount.findUnique({
      where: { id }
    });
  }

  async update(id: string, updateDto: UpdatePaymentAccountDto) {
    // If setting as default, unset all other defaults
    if (updateDto.isDefault) {
      await this.prisma.paymentAccount.updateMany({
        where: {
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      });
    }

    return this.prisma.paymentAccount.update({
      where: { id },
      data: updateDto
    });
  }

  remove(id: string) {
    return this.prisma.paymentAccount.delete({
      where: { id }
    });
  }

  // Get default payment account
  getDefault() {
    return this.prisma.paymentAccount.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    });
  }

  // Get all active accounts
  getActive() {
    return this.prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { accountName: 'asc' }
      ]
    });
  }
}
