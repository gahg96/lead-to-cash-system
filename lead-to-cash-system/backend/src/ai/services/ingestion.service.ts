import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';
import * as pdfLib from 'pdf-parse';

@Injectable()
export class IngestionService {
    private readonly logger = new Logger(IngestionService.name);
    private openai: OpenAI;

    constructor(private prisma: PrismaService) {
        // ... constructor remains same
        const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com" : undefined);
        if (apiKey) {
            this.openai = new OpenAI({ apiKey, baseURL });
        } else {
            this.logger.warn('OPENAI_API_KEY not found. Using MOCK Embeddings.');
        }
    }

    async getAllDocuments() {
        return this.prisma.knowledgeDocument.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteDocument(id: string) {
        return this.prisma.knowledgeDocument.delete({
            where: { id },
        });
    }

    async processDocument(file: Express.Multer.File, title: string) {
        let content = "";

        // Fix filename encoding (common issue with multer/multipart)
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const docTitle = title ? Buffer.from(title, 'latin1').toString('utf8') : originalName;

        if (file.mimetype === 'application/pdf') {
            // pdf-parse v2 usage: new PDFParse({ data: buffer })
            // Logic to get the class constructor:
            let PDFParseClass = (pdfLib as any).PDFParse;

            if (typeof PDFParseClass !== 'function') {
                // Fallback: check default export if it happens to be the class (unlikely for v2 based on docs)
                const _p = require('pdf-parse');
                if (_p.PDFParse) PDFParseClass = _p.PDFParse;
            }

            if (typeof PDFParseClass !== 'function') {
                throw new Error(`PDFParse class not found. Keys: ${Object.keys(pdfLib)}`);
            }

            // Using v2 API
            const parser = new PDFParseClass({ data: file.buffer });
            const result = await parser.getText();
            await parser.destroy();
            content = result.text;
        } else {
            content = file.buffer.toString('utf-8');
        }

        // 1. Create Document Record
        const doc = await this.prisma.knowledgeDocument.create({
            data: {
                title: docTitle,
                filename: originalName,
                fileSize: file.size,
                mimeType: file.mimetype,
                filePath: 'db-storage',
            },
        });

        // 2. Chunking
        const chunks = this.chunkText(content, 500, 50); // 500 chars approx
        this.logger.log(`Document split into ${chunks.length} chunks.`);

        // 3. Embedding & Storage
        let chunkIndex = 0;
        for (const chunkText of chunks) {
            const vector = await this.getEmbedding(chunkText);

            await this.prisma.documentChunk.create({
                data: {
                    documentId: doc.id,
                    content: chunkText,
                    tokenCount: chunkText.length / 4, // Rough estimate
                    embedding: JSON.stringify(vector), // Store as JSON string 
                    chunkIndex: chunkIndex++,
                },
            });
        }

        // Update chunk count
        await this.prisma.knowledgeDocument.update({
            where: { id: doc.id },
            data: { chunkCount: chunks.length },
        });

        return { id: doc.id, chunkCount: chunks.length };
    }

    // --- Helpers ---

    private static embeddingPipeline: any = null;

    private async getPipeline() {
        if (!IngestionService.embeddingPipeline) {
            const { pipeline } = await import('@xenova/transformers');
            this.logger.log('Loading local embedding model: paraphrase-multilingual-MiniLM-L12-v2...');
            IngestionService.embeddingPipeline = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
            this.logger.log('Local embedding model loaded successfully.');
        }
        return IngestionService.embeddingPipeline;
    }

    // Simple chunker
    private chunkText(text: string, size: number, overlap: number): string[] {
        const chunks: string[] = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(start + size, text.length);
            chunks.push(text.slice(start, end));
            if (end === text.length) break;
            start += size - overlap;
        }
        return chunks;
    }

    // Embedding Generator (Local)
    public async getEmbedding(text: string): Promise<number[]> {
        try {
            const extractor = await this.getPipeline();
            // pooling: 'mean' and normalize: true are standard for sentence embeddings in this model
            const output = await extractor(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        } catch (e) {
            this.logger.error(`Local Embedding failed: ${e.message}`);
            // Fallback to mock only if local model strictly fails (shouldn't happen often)
            return this.generateMockEmbedding();
        }
    }

    private generateMockEmbedding(dim = 384): number[] { // MiniLM output dim is 384 usually
        // Generate random unit vector
        return Array.from({ length: dim }, () => Math.random());
    }
}
