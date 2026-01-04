
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    displayName?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsString()
    @IsOptional()
    password?: string; // Optional password reset
}
