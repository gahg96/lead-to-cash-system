
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const opportunityId = '021abe48-76c4-49d5-91e9-f114cdb084e4'; // From screenshot

    console.log(`Fetching opportunity ${opportunityId}...`);
    const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
        include: {
            customer: true,
            vendors: true,
            procurements: {
                include: {
                    lineItems: {
                        orderBy: { sortOrder: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!opportunity) {
        console.error('Opportunity not found!');
        return;
    }

    console.log('Opportunity found. Procurements:', opportunity.procurements.length);

    // Simulate Service Logic
    const wonProcurement = opportunity.procurements.find(p => p.status === 'Won')
        || opportunity.procurements[0];

    console.log('Won/Latest Procurement:', wonProcurement ? 'Found' : 'Undefined');

    // The Fix Check:
    try {
        // Logic from contracts.service.ts
        const lineItemsConfig = wonProcurement?.lineItems?.length > 0 ? {
            create: [] // Dummy
        } : undefined;

        console.log('Line Items Config calculated successfully:', lineItemsConfig === undefined ? 'Undefined (Correct)' : 'Object');
    } catch (error) {
        console.error('CRASH DETECTED in Line Items Logic:', error);
    }

    // Check data preparation
    try {
        const primaryVendor = opportunity.vendors && opportunity.vendors.length > 0
            ? opportunity.vendors[0]
            : null;

        console.log('Primary Vendor:', primaryVendor?.name);

        const totalContractValue = (opportunity.estimatedValue ? Number(opportunity.estimatedValue) : 0);

        console.log('Data prep successful. Ready to create.');
    } catch (error) {
        console.error('CRASH DETECTED in Data Prep:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
