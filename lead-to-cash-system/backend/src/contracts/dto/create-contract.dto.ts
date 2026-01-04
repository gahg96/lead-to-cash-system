import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';

export class CreateContractDto {
    @IsNotEmpty()
    @IsString()
    opportunityId: string;

    @IsNotEmpty()
    @IsString()
    contractNumber: string;

    @IsOptional()
    @IsNumber()
    totalContractValue?: number;

    @IsOptional()
    @IsString()
    paymentTerms?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsString()
    riskAssessment?: string;

    @IsOptional()
    @IsString()
    scope?: string;

    @IsOptional()
    @IsString()
    sla?: string;

    @IsOptional()
    @IsString()
    liability?: string;

    @IsOptional()
    @IsString()
    @IsOptional()
    @IsString()
    paymentTermsDetails?: string;

    @IsOptional()
    @IsString()
    paymentAccount?: string;

    @IsOptional()
    @IsString()
    bankName?: string;

    @IsOptional()
    @IsString()
    accountName?: string;

    @IsOptional()
    @IsString()
    penalties?: string;

    @IsOptional()
    @IsString()
    warranty?: string;

    @IsOptional()
    @IsString()
    confidentiality?: string;

    @IsOptional()
    @IsString()
    disputeResolution?: string;

    @IsOptional()
    @IsString()
    specialTerms?: string;

    // Optional: Drafter ID typically comes from current user, but DTO might allow it
    @IsOptional()
    @IsString()
    drafterId?: string;
}
