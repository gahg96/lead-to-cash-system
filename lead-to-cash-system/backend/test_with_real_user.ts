import { PrismaClient, ContractStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testWithRealUser() {
    const opportunityId = '282c222c-ad64-49e1-92ba-61731154ba68';
    const realUserId = '1ff211e6-6b44-4d57-9920-2ef788334de7'; // admin user

    console.log('=== Testing Contract Creation with Real User ===\n');

    try {
        const opportunity = await prisma.opportunity.findUnique({
            where: { id: opportunityId },
            include: {
                customer: true,
                vendors: true,
                procurements: {
                    include: {
                        lineItems: true
                    }
                }
            }
        });

        if (!opportunity) {
            throw new Error('Opportunity not found');
        }

        const wonProcurement = opportunity.procurements.find(p => p.status === 'Won') || opportunity.procurements[0];
        const primaryVendor = opportunity.vendors?.[0];

        const contractData = {
            opportunityId,
            contractNumber: `CTR-REAL-${Date.now()}`,
            totalContractValue: 100000,
            wonPrice: wonProcurement?.wonPrice != null ? Number(wonProcurement.wonPrice) : null,
            estimatedValue: opportunity.estimatedValue != null ? Number(opportunity.estimatedValue) : null,
            customerContactName: opportunity.customer?.contactName,
            customerContactPhone: opportunity.customer?.contactPhone,
            customerContactEmail: opportunity.customer?.contactEmail,
            customerContactTitle: opportunity.customer?.contactTitle,
            vendorName: primaryVendor?.name,
            vendorContactName: primaryVendor?.contactName,
            vendorContactPhone: primaryVendor?.contactPhone,
            status: ContractStatus.Draft,
            drafterId: realUserId, // Using real user ID
        };

        console.log('Creating contract with real user ID:', realUserId);

        const contract = await prisma.contract.create({
            data: contractData
        });

        console.log('\n✅ SUCCESS! Contract created:');
        console.log('  ID:', contract.id);
        console.log('  Contract Number:', contract.contractNumber);
        console.log('  Drafter ID:', contract.drafterId);

        // Clean up - delete the test contract
        await prisma.contract.delete({
            where: { id: contract.id }
        });
        console.log('\n🧹 Test contract deleted');

    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

testWithRealUser();
