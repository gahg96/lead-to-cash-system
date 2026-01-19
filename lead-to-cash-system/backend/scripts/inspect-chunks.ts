
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const keyword = process.argv[2]; // Optional search keyword

    console.log(`\n🔍 Inspecting Vector Chunks...`);
    if (keyword) {
        console.log(`   Filter: content contains "${keyword}"\n`);
    } else {
        console.log(`   Showing recent 20 chunks (pass a keyword to search)\n`);
    }

    const chunks = await prisma.documentChunk.findMany({
        where: keyword ? {
            content: {
                contains: keyword
            }
        } : undefined,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
            document: true
        }
    });

    if (chunks.length === 0) {
        console.log("No chunks found.");
        return;
    }

    chunks.forEach(chunk => {
        console.log("------------------------------------------------");
        console.log(`ID: ${chunk.id}`);
        console.log(`Source: ${chunk.document.title}`);
        console.log(`Index: ${chunk.chunkIndex} | Tokens: ${chunk.tokenCount}`);
        console.log(`Content Preview:\n${chunk.content.substring(0, 200).replace(/\n/g, ' ')}...`);

        // Show a snippet of embedding to prove it exists
        const vec = JSON.parse(chunk.embedding);
        console.log(`Vector: [${vec.slice(0, 5).map(n => n.toFixed(4)).join(', ')}, ... (${vec.length} dims)]`);
    });
    console.log("------------------------------------------------\n");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
