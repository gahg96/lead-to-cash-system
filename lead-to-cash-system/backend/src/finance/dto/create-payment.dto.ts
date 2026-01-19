import { IsString, IsNumber, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { PaymentMethod, PaymentType } from '@prisma/client';

export class CreatePaymentDto {
    @IsString()
    invoiceId: string;

    @IsDateString()
    paymentDate: string;

    @IsNumber()
    amount: number;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsString()
    @IsOptional()
    bankName?: string;

    @IsString()
    @IsOptional()
    transactionRef?: string;

    @IsString()
    @IsOptional()
    remarks?: string;

    // Payment Type and Bank Account Fields
    @IsOptional()
    @IsEnum(PaymentType)
    paymentType?: PaymentType;

    @IsString()
    @IsOptional()
    fromAccount?: string;

    @IsString()
    @IsOptional()
    toAccount?: string;
}
