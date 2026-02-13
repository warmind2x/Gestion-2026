import { Injectable, Logger } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as readline from 'readline';

interface AccProject {
  lcpCode: string;
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
}

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);
  constructor(private prisma: PrismaService) {}

  async importBudget(filePath: string): Promise<void> {
    const stream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const map = new Map<string, AccProject>();

    for await (const line of rl) {
      if (!line.trim()) continue;

      if (!line.trim().startsWith('LCP-')) {
        continue;
      }

      const cleanLine = line.trim();

      const columns = cleanLine.split('\t');

      const [lcpCode, name, userId, date, amountRaw, currency] = columns;

      const amount = Number(amountRaw);

      if (!lcpCode || !name || isNaN(amount)) continue;

      const key = `${lcpCode}|${name}|${currency}`;

      if (map.has(key)) {
        map.get(key)!.amount += amount;
      } else {
        map.set(key, {
          lcpCode: lcpCode.trim(),
          name: name.trim(),

          amount,
          currency: currency?.trim() || 'CLP',
        });
      }
    }

    this.logger.log(map);

    await this.prisma.project.createMany({
      data: Array.from(map.values()),
    });

    this.logger.log('Importación finalizada');
  }

  create(createProjectDto: CreateProjectDto) {
    return 'This action adds a new project';
  }

  findAll() {
    return this.prisma.project.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {
    return `This action removes a #${id} project`;
  }
}
