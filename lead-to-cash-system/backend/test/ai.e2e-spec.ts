
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AiController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    }, 30000); // 30s timeout

    it('/ai/upload (POST) - should ingest document', async () => {
        return request(app.getHttpServer())
            .post('/ai/upload')
            .attach('file', Buffer.from('Antigravity is great.'), 'demo.txt')
            .field('title', 'Demo Doc')
            .expect(201)
            .expect((res) => {
                expect(res.body.chunkCount).toBeGreaterThan(0);
            });
    });

    it('/ai/chat (POST) - should return answer', async () => {
        // Wait a bit for indexing if async (ours is sync)
        return request(app.getHttpServer())
            .post('/ai/chat')
            .send({ question: 'What is Antigravity?' })
            .expect(201)
            .expect((res) => {
                // Since we might be using Mock, we just check structure
                expect(res.body).toHaveProperty('answer');
                expect(res.body).toHaveProperty('sources');
            });
    });

    afterAll(async () => {
        await app.close();
    });
});
