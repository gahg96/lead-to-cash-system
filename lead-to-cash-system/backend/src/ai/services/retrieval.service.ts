import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestionService } from './ingestion.service';

export interface ScoredChunk {
    content: string;
    score: number;
    documentTitle: string;
}

@Injectable()
export class RetrievalService {
    private readonly logger = new Logger(RetrievalService.name);

    constructor(
        private prisma: PrismaService,
        private ingestion: IngestionService // To reuse getEmbedding
    ) { }

    async search(query: string, topK = 10): Promise<ScoredChunk[]> {
        // 1. Get Query Embedding
        const queryVector = await this.ingestion.getEmbedding(query);

        // 2. Fetch all chunks (In-Memory Search Strategy for SQLite Demo)
        const allChunks = await this.prisma.documentChunk.findMany({
            include: { document: true },
        });

        // 3. Calculate Similarity
        const scores = allChunks.map(chunk => {
            let vec: number[];
            try {
                vec = JSON.parse(chunk.embedding);
            } catch (e) {
                return { chunk, score: -1 };
            }

            const score = this.cosineSimilarity(queryVector, vec);
            return { chunk, score };
        });

        // 4. Sort & TopK
        const topChunks = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        this.logger.log(`Query: "${query}" retrieved ${topChunks.length} chunks.`);
        topChunks.forEach((item, idx) => {
            this.logger.log(`Rank ${idx + 1}: [${item.chunk.document.title}] (Score: ${item.score.toFixed(4)}) - ${item.chunk.content.substring(0, 50)}...`);
        });

        return topChunks.map(item => ({
            content: item.chunk.content,
            score: item.score,
            documentTitle: item.chunk.document.title,
        }));
    }

    // Math helper
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) return 0;

        let dot = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
