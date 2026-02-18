import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as readline from 'readline';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private prisma: PrismaService) {}

  // ======================================================
  // 🔑 FUNCIONES UTILITARIAS CLAVE
  // ======================================================

  /**
   * Convierte números estilo SAP:
   * 110.000,00 → 110000.00
   */
  private parseAmount(value: string): number {
    if (!value) return 0;

    const normalized = value
      .replace(/\./g, '') // miles
      .replace(',', '.') // decimal
      .trim();

    const result = Number(normalized);
    return isNaN(result) ? 0 : result;
  }

  /**
   * Parsea códigos LCP completos:
   * LCP-130109-01
   * LCP-130109-01-EX
   */

  private parseCode(code: string) {
    return code.split('-').slice(0, 2).join('-'); // LCP-130109
  }
  private isExpense(code: string): boolean {
    return code.toUpperCase().includes('-EX');
  }

  // ======================================================
  // 📥 IMPORTADOR DE PRESUPUESTO
  // ======================================================
  async importBudget(filePath: string): Promise<void> {
    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    const projects = new Map<
      string,
      {
        name: string;
        capTotal: number;
        expTotal: number;
      }
    >();

    // ------------------------------
    // 1️⃣ Leer archivo
    // ------------------------------
    for await (const rawLine of rl) {
      const line = rawLine.trim();
      if (!line.startsWith('LCP-')) continue;

      const [lcpCode, name, reference, dateRaw, amountRaw, currencyRaw] =
        line.split('\t');

      if (!lcpCode || !name || !amountRaw) continue;

      const amount = this.parseAmount(amountRaw);
      if (amount === 0) continue;

      const mainCode = this.parseCode(lcpCode);
      const expense = this.isExpense(lcpCode);

      if (!projects.has(mainCode)) {
        projects.set(mainCode, {
          name,
          capTotal: 0,
          expTotal: 0,
        });
      }
      const project = projects.get(mainCode)!;
      if (expense) {
        project.expTotal += amount;
      } else {
        project.capTotal += amount;
      }
    }

    const proyectos = await this.prisma.$transaction(
      [...projects].map(([lcpCode, data]) =>
        this.prisma.project.upsert({
          where: { lcpCode },
          update: {
            name: data.name,
            capTotal: data.capTotal,
            expTotal: data.expTotal,
          },
          create: {
            lcpCode,
            name: data.name,
            capTotal: data.capTotal,
            expTotal: data.expTotal,
          },
        }),
      ),
    );

    this.logger.log(`Movimientos leídos: ${proyectos.length}`);
  }

  // ======================================================
  // CRUD BÁSICO (para el controller)
  // ======================================================

  create(createProjectDto: CreateProjectDto) {
    return null; // Implementación pendiente
  }

  findAll() {
    return null;
  }

  findOne(id: number) {
    return null;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return null;
  }

  remove(id: number) {
    return null;
  }
}
