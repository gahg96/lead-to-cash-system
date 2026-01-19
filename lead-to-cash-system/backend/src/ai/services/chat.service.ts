import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { RetrievalService } from './retrieval.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);
    private openai: OpenAI;

    constructor(private retrieval: RetrievalService) {
        const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
        const baseURL = process.env.OPENAI_BASE_URL || (process.env.DEEPSEEK_API_KEY ? "https://api.deepseek.com" : undefined);
        if (apiKey) {
            this.openai = new OpenAI({ apiKey, baseURL });
        }
    }

    async chat(question: string) {
        // 1. Retrieve Context
        const docs = await this.retrieval.search(question, 3);
        const contextText = docs.map((d, i) => `[${i + 1}] ${d.content}`).join('\n\n');

        // 2. Construct Prompt
        const systemPrompt = `You are a helpful assistant for the Lead-to-Cash system.
Use the following context to answer the user's question.
If the answer is not in the context, say you don't know.

Context:
${contextText}`;

        this.logger.log(`Prompt constructed with ${docs.length} context chunks.`);

        // 3. Generate
        if (this.openai) {
            try {
                const completion = await this.openai.chat.completions.create({
                    model: process.env.LLM_MODEL || "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: question },
                    ],
                });
                return {
                    answer: completion.choices[0].message.content,
                    sources: docs.map(d => d.documentTitle),
                };
            } catch (e) {
                this.logger.error(`Question was: ${JSON.stringify(question)}`);
                this.logger.error(`OpenAI Chat failed: ${e.message}`);
                return {
                    answer: "Sorry, I am unable to connect to the AI service right now.",
                    sources: []
                };
            }
        }

        // Mock Response
        return {
            answer: `[MOCK MODE] Based on your question "${question}", here is a simulated answer.\nFound ${docs.length} relevant documents.`,
            sources: docs.map(d => d.documentTitle),
            debugContext: docs,
        };
    }
}
