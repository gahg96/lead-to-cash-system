import { PrismaClient, ContractStatus, LineItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function testContractCreation() {
    const opportunityId = '282c222c-ad64-49e1-92ba-61731154ba68';
    const userId = 'test-user-id'; // We'll use a dummy user ID for testing

    console.log('=== Testing Contract Creation ===\n');

    try {
        // Step 1: Fetch opportunity
        console.log('Step 1: Fetching opportunity...');
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
            throw new Error('Opportunity not found');
        }
        console.log('✓ Opportunity found:', opportunity.title);

        // Step 2: Get procurement
        const wonProcurement = opportunity.procurements.find(p => p.status === 'Won')
            || opportunity.procurements[0];
        console.log('✓ Procurement:', wonProcurement ? 'Found' : 'Not found');

        // Step 3: Calculate values
        const totalContractValue = 100000; // Test value
        console.log('✓ Total contract value:', totalContractValue);

        // Step 4: Get vendor
        const primaryVendor = opportunity.vendors && opportunity.vendors.length > 0
            ? opportunity.vendors[0]
            : null;
        console.log('✓ Primary vendor:', primaryVendor ? primaryVendor.name : 'None');

        // Step 5: Prepare contract data
        console.log('\nStep 5: Preparing contract data...');
        const contractData = {
            opportunityId,
            contractNumber: `CTR-TEST-${Date.now()}`,
            totalContractValue,
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
            drafterId: userId,
        };

        console.log('Contract data prepared:');
        console.log(JSON.stringify(contractData, null, 2));

        // Step 6: Try to create contract
        console.log('\nStep 6: Creating contract in database...');
        const contract = await prisma.contract.create({
            data: contractData,
            include: {
                drafter: true,
                opportunity: {
                    include: {
                        customer: true
                    }
                },
                lineItems: true
            },
        });

        console.log('\n✅ SUCCESS! Contract created:');
        console.log('  ID:', contract.id);
        console.log('  Contract Number:', contract.contractNumber);
        console.log('  Total Value:', contract.totalContractValue);

    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('\nFull error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testContractCreation();
