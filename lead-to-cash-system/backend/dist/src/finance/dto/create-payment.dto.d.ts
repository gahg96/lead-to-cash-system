import { PaymentMethod, PaymentType } from '@prisma/client';
export declare class CreatePaymentDto {
    invoiceId: string;
    paymentDate: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankName?: string;
    transactionRef?: string;
    remarks?: string;
    paymentType?: PaymentType;
    fromAccount?: string;
    toAccount?: string;
}
