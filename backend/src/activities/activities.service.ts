import { Injectable } from '@nestjs/common';
import { ActivityStatus } from '../../generated/prisma/client';
import { AppException } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryActivitiesDto) {
    const where = query.status ? { status: query.status as ActivityStatus } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        orderBy: { startTime: 'desc' },
        skip: query.skip,
        take: query.take,
        include: { _count: { select: { registrations: true } } },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { items, total };
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw AppException.notFound('ไม่พบกิจกรรมนี้ในระบบ');
    return activity;
  }

  async create(dto: CreateActivityDto, createdBy: string) {
    if (new Date(dto.endTime) <= new Date(dto.startTime)) {
      throw AppException.badRequest('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มกิจกรรม');
    }
    if (dto.coopHours <= 0 && dto.volunteerHours <= 0 && dto.majorHours <= 0) {
      throw AppException.badRequest('กิจกรรมต้องให้ชั่วโมงอย่างน้อยหนึ่งประเภท');
    }
    return this.prisma.activity.create({
      data: {
        title: dto.title,
        description: dto.description,
        location: dto.location,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        date: new Date(dto.startTime),
        registrationOpen: new Date(),
        registrationClose: new Date(dto.registrationDeadline),
        registrationDeadline: new Date(dto.registrationDeadline),
        capacity: dto.capacity,
        lecturerInCharge: dto.lecturerInCharge,
        coopHours: dto.coopHours,
        volunteerHours: dto.volunteerHours,
        majorHours: dto.majorHours,
        hours: dto.coopHours + dto.volunteerHours + dto.majorHours,
        status: ActivityStatus.OPEN,
        createdBy,
      },
    });
  }

  async update(id: string, dto: UpdateActivityDto) {
    await this.findOne(id);
    return this.prisma.activity.update({
      where: { id },
      data: {
        ...dto,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        registrationDeadline: dto.registrationDeadline ? new Date(dto.registrationDeadline) : undefined,
        registrationClose: dto.registrationDeadline ? new Date(dto.registrationDeadline) : undefined,
      },
    });
  }

  async setStatus(id: string, status: ActivityStatus) {
    await this.findOne(id);
    return this.prisma.activity.update({ where: { id }, data: { status } });
  }

  /** ลบกิจกรรม — registrations/participations/hour_requests ที่ผูกกับกิจกรรมนี้ถูกลบตาม (Cascade) */
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.activity.delete({ where: { id } });
    return { id, deleted: true };
  }
}
