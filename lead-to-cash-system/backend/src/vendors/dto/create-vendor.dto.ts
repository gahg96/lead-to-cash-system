import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVendorDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    industry?: string;

    @IsOptional()
    @IsString()
    region?: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsOptional()
    @IsString()
    parentId?: string;

    @IsOptional()
    @IsString()
    contactName?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    customerIds?: string[];
}
