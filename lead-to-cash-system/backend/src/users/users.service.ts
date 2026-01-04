import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        try {
            const admin = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
            if (!admin) {
                console.log('Seeding default admin user...');
                await this.create({
                    username: 'admin',
                    passwordHash: 'admin123',
                    displayName: 'System Admin',
                    role: 'ADMIN',
                });
            }

            const staffToSeed = [
                { username: 'ceo', display: '张总 (CEO)', role: 'MANAGER' },
                { username: 'sales', display: '销售王 (Sales)', role: 'SALES' },
                { username: 'commerce', display: '商务李 (商务)', role: 'COMMERCIAL' },
                { username: 'approver', display: '审批陈 (合同审批人)', role: 'MANAGER' },
                { username: 'drafter', display: '拟稿赵 (合同拟稿)', role: 'USER' },
                { username: 'pm_zhou', display: '项目经理周 (PM)', role: 'MANAGER' },
                { username: 'dev_han', display: '开发韩 (软件开发工程师)', role: 'DEVELOPER' },
                { username: 'qa_wu', display: '测试吴 (软件测试工程师)', role: 'TECHNICAL' },
                { username: 'architect_feng', display: '架构冯 (架构师)', role: 'TECHNICAL' },
                { username: 'ai_shen', display: 'AI沈 (AI工程师)', role: 'TECHNICAL' },
            ];

            for (const staff of staffToSeed) {
                try {
                    const existing = await this.prisma.user.findUnique({ where: { username: staff.username } });
                    if (!existing) {
                        console.log(`Seeding user: ${staff.username}`);
                        await this.create({
                            username: staff.username,
                            passwordHash: 'user123',
                            displayName: staff.display,
                            role: staff.role as any,
                        });
                    }
                } catch (err) {
                    console.error(`Failed to seed user ${staff.username}:`, err);
                }
            }
        } catch (globalError) {
            console.error('UsersService.onModuleInit failed:', globalError);
        }
    }

    async findOne(username: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { username } });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async create(data: any): Promise<User> {
        const salt = await bcrypt.genSalt();
        // Handle both password (DTO) and passwordHash (Seeding)
        const passwordToHash = data.password || data.passwordHash;
        const hash = await bcrypt.hash(passwordToHash, salt);

        const { password, ...rest } = data; // Remove password field if exists

        return this.prisma.user.create({
            data: {
                ...rest,
                passwordHash: hash,
            }
        });
    }

    async findAll(): Promise<User[]> {
        try {
            const users = await this.prisma.user.findMany({
                orderBy: { createdAt: 'desc' }
            });
            // Ensure plain objects for serialization stability and remove passwords
            return JSON.parse(JSON.stringify(users.map(u => {
                const { passwordHash, ...rest } = u;
                return rest;
            })));
        } catch (error) {
            console.error('UsersService.findAll error:', error);
            throw error;
        }
    }

    async update(id: string, data: any): Promise<User> {
        const updateData: any = { ...data };

        if (updateData.password) {
            const salt = await bcrypt.genSalt();
            updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
            delete updateData.password;
        }

        const user = await this.prisma.user.update({
            where: { id },
            data: updateData
        });

        // Remove sensitive data
        const { passwordHash, ...rest } = user;
        return rest as any;
    }

    async remove(id: string): Promise<User> {
        return this.prisma.user.delete({
            where: { id }
        });
    }
}
