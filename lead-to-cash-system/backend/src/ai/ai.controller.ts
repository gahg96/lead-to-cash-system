import { Controller, Post, Body, UseInterceptors, UploadedFile, Get, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IngestionService } from './services/ingestion.service';
import { ChatService } from './services/chat.service';
import { ChatQueryDto, UploadDocumentDto } from './dto/ai.dto';

@Controller('ai')
export class AiController {
    constructor(
        private ingestion: IngestionService,
        private chatService: ChatService,
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: UploadDocumentDto
    ) {
        return this.ingestion.processDocument(file, body.title);
    }

    @Post('chat')
    async chat(@Body() body: { question: string }) {
        console.log('Received chat body:', JSON.stringify(body));
        const { question } = body;
        if (!question) {
            return { answer: "No question provided.", sources: [] };
        }
        return this.chatService.chat(question);
    }

    @Get('documents')
    async getDocuments() {
        return this.ingestion.getAllDocuments();
    }

    @Delete('documents/:id')
    async deleteDocument(@Param('id') id: string) {
        return this.ingestion.deleteDocument(id);
    }
}
