import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { IngestionService } from './services/ingestion.service';
import { RetrievalService } from './services/retrieval.service';
import { ChatService } from './services/chat.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AiController],
    providers: [IngestionService, RetrievalService, ChatService],
})
export class AiModule { }
