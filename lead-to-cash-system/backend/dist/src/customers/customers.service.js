"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCustomerDto) {
        console.log('Creating customer:', createCustomerDto);
        return this.prisma.customer.create({
            data: createCustomerDto,
        });
    }
    async findAll() {
        return this.prisma.customer.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.customer.findUnique({
            where: { id },
        });
    }
    async update(id, updateCustomerDto) {
        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
        });
    }
    async getCityDistribution() {
        const result = await this.prisma.customer.groupBy({
            by: ['city'],
            _count: {
                city: true,
            },
        });
        const wonCitiesRaw = await this.prisma.opportunity.findMany({
            where: {
                status: 'Won',
                customer: {
                    city: { not: null }
                }
            },
            select: {
                customer: {
                    select: { city: true }
                }
            }
        });
        const wonCounts = {};
        wonCitiesRaw.forEach(item => {
            const city = item.customer?.city;
            if (city) {
                wonCounts[city] = (wonCounts[city] || 0) + 1;
            }
        });
        return result.map(item => ({
            name: item.city || 'Unknown',
            value: item._count.city,
            wonDealCount: item.city ? (wonCounts[item.city] || 0) : 0
        }));
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map