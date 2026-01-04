import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentAccountDto {
    @IsString()
    @IsNotEmpty()
    accountName: string;

    @IsString()
    @IsNotEmpty()
    bankName: string;

    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsString()
    @IsOptional()
    description?: string;
}
