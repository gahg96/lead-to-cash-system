import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto) {
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

    async findOne(id: string) {
        return this.prisma.customer.findUnique({
            where: { id },
        });
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto) {
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

        // Find cities with WON opportunities and count them
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

        // Count won deals per city
        const wonCounts: Record<string, number> = {};
        wonCitiesRaw.forEach(item => {
            const city = item.customer?.city;
            if (city) {
                wonCounts[city] = (wonCounts[city] || 0) + 1;
            }
        });

        // Format for ECharts: { name: 'City', value: Count, wonDealCount: number }
        return result.map(item => ({
            name: item.city || 'Unknown',
            value: item._count.city,
            wonDealCount: item.city ? (wonCounts[item.city] || 0) : 0
        }));
    }
}
