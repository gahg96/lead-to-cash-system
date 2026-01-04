import { CreateProcurementDto } from './create-procurement.dto';
export declare enum ProcurementStatus {
    Draft = "Draft",
    Preparing = "Preparing",
    Submitted = "Submitted",
    InProgress = "InProgress",
    Won = "Won",
    Lost = "Lost"
}
declare const UpdateProcurementDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateProcurementDto>>;
export declare class UpdateProcurementDto extends UpdateProcurementDto_base {
    status?: ProcurementStatus;
    wonPrice?: number;
    lineItems?: {
        name: string;
        type: string;
        amount: number;
        description?: string;
    }[];
}
export {};
