import { Injectable } from '@nestjs/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) { }

  async create(createVendorDto: CreateVendorDto) {
    console.log('Create Vendor Payload:', JSON.stringify(createVendorDto));
    const { customerIds, ...rest } = createVendorDto;

    // Safety check: remove website if it somehow persists
    if ('website' in rest) {
      delete (rest as any)['website'];
    }

    // Handle empty parentId
    if ((rest as any).parentId === "") {
      (rest as any).parentId = null;
    }

    try {
      const result = await this.prisma.vendor.create({
        data: {
          ...rest,
          customers: customerIds && customerIds.length > 0 ? {
            connect: customerIds.map(id => ({ id }))
          } : undefined,
        },
      });
      return result;
    } catch (error) {
      console.error('Create Vendor Error:', error);
      throw error;
    }
  }

  findAll() {
    return this.prisma.vendor.findMany({
      include: {
        customers: true,
        parent: true,
        children: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.vendor.findUnique({
      where: { id },
      include: {
        customers: true,
        parent: true,
        children: true
      },
    });
  }

  async update(id: string, updateVendorDto: UpdateVendorDto) {
    console.log('Update Vendor Payload:', JSON.stringify(updateVendorDto));
    const { customerIds, ...rest } = updateVendorDto;

    // Safety check: remove website if it somehow persists
    if ('website' in rest) {
      delete (rest as any)['website'];
    }

    // Handle empty parentId
    if ((rest as any).parentId === "") {
      (rest as any).parentId = null;
    }

    try {
      const result = await this.prisma.vendor.update({
        where: { id },
        data: {
          ...(rest as any),
          customers: customerIds ? {
            set: customerIds.map(cid => ({ id: cid }))
          } : undefined,
        },
        include: {
          customers: true,
          parent: true,
          children: true
        },
      });
      return result;
    } catch (error) {
      console.error('Update Vendor Error:', error);
      throw error;
    }
  }

  remove(id: string) {
    return this.prisma.vendor.delete({
      where: { id },
    });
  }
}
