import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const opportunityId = '282c222c-ad64-49e1-92ba-61731154ba68';

    console.log('=== Examining Opportunity ===');
    console.log('ID:', opportunityId);

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
        console.log('❌ Opportunity not found!');
        await prisma.$disconnect();
        return;
    }

    console.log('\n--- Basic Info ---');
    console.log('Title:', opportunity.title);
    console.log('Status:', opportunity.status);
    console.log('Estimated Value:', opportunity.estimatedValue?.toString());

    console.log('\n--- Customer Info ---');
    if (opportunity.customer) {
        console.log('Customer ID:', opportunity.customer.id);
        console.log('Company Name:', opportunity.customer.companyName);
        console.log('Contact Name:', opportunity.customer.contactName);
        console.log('Contact Email:', opportunity.customer.contactEmail);
        console.log('Contact Phone:', opportunity.customer.contactPhone);
        console.log('Contact Title:', opportunity.customer.contactTitle);
    } else {
        console.log('❌ NO CUSTOMER LINKED!');
    }

    console.log('\n--- Vendors ---');
    console.log('Vendors count:', opportunity.vendors?.length || 0);
    if (opportunity.vendors && opportunity.vendors.length > 0) {
        opportunity.vendors.forEach((v, i) => {
            console.log(`  Vendor ${i + 1}:`, v.name);
        });
    }

    console.log('\n--- Procurements ---');
    console.log('Procurements count:', opportunity.procurements?.length || 0);
    if (opportunity.procurements && opportunity.procurements.length > 0) {
        opportunity.procurements.forEach((p, i) => {
            console.log(`  Procurement ${i + 1}:`);
            console.log('    Status:', p.status);
            console.log('    Won Price:', p.wonPrice?.toString());
            console.log('    Line Items:', p.lineItems?.length || 0);
            if (p.lineItems && p.lineItems.length > 0) {
                p.lineItems.forEach((item, j) => {
                    console.log(`      Item ${j + 1}: ${item.name} (${item.type}) - ${item.amount}`);
                });
            }
        });
    }

    console.log('\n=== Analysis ===');
    const wonProcurement = opportunity.procurements.find(p => p.status === 'Won') || opportunity.procurements[0];
    console.log('Won/Latest Procurement:', wonProcurement ? 'Found' : 'Not found');
    if (wonProcurement) {
        console.log('  Has line items:', wonProcurement.lineItems?.length > 0 ? 'Yes' : 'No');
    }

    await prisma.$disconnect();
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
