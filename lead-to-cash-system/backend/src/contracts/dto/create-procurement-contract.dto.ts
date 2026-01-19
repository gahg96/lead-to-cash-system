import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';

export enum ProcurementCategory {
    SUBCONTRACTING = 'SUBCONTRACTING',
    SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
    OFFICE_RENT = 'OFFICE_RENT',
    CONSULTING = 'CONSULTING',
    OTHER = 'OTHER',
}

export class CreateProcurementContractDto {
    @IsString()
    contractNumber: string;

    @IsString()
    vendorId: string;

    @IsEnum(ProcurementCategory)
    procurementCategory: ProcurementCategory;

    @IsOptional()
    @IsString()
    relatedSalesContractId?: string;

    @IsOptional()
    @IsString()
    endCustomerId?: string;  // 最终客户（默认为公司自己）

    @IsNumber()
    totalContractValue: number;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @IsOptional()
    @IsString()
    scope?: string;
}
