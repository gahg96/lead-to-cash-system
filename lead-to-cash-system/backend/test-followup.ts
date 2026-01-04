import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFollowUp() {
    try {
        // Get first opportunity
        const opp = await prisma.opportunity.findFirst();

        if (!opp) {
            console.log('No opportunity found');
            return;
        }

        console.log('Found opportunity:', opp.id);

        // Try to create a follow-up
        const followUp = await prisma.followUp.create({
            data: {
                opportunityId: opp.id,
                content: '<p>Test follow-up</p>',
                createdById: null,
            },
        });

        console.log('✅ Follow-up created successfully:', followUp.id);
    } catch (error) {
        console.error('❌ Error creating follow-up:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFollowUp();
