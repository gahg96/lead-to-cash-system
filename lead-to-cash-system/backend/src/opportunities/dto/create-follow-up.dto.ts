import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFollowUpDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    createdBy?: string;
}
