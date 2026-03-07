import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as readline from 'readline';
import { ProjectStatus } from '../generated/prisma/client';
import { ImportBudgetResult } from './dto/import-budget-result.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private prisma: PrismaService) {}

  // ======================================================
  // 🔑 FUNCIONES UTILITARIAS
  // ======================================================

  /** 110.000,00 → 110000.00 */
  private parseAmount(value: string): number {
    if (!value) return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.').trim();
    const result = Number(normalized);
    return isNaN(result) ? 0 : result;
  }

  /** LCP-200158-01-EX → LCP-200158 */
  private parseCode(code: string): string {
    return code.split('-').slice(0, 2).join('-');
  }

  private isExpense(code: string): boolean {
    return code.toUpperCase().includes('-EX');
  }

  /** Clave lógica de gasto (sin tocar schema) */
  private buildExpenseKey(
    expDescription: string,
    amount: number,
    currency: string,
    purchaseDate: string,
    PO: string,
  ): string {
    return `${PO}|${purchaseDate}|${amount}|${currency}|${expDescription}`;
  }

  private parseDate(dateStr: string): Date | null {
    const parsed = dateStr.replace(/\./g, '-').split('-').reverse().join('-');
    return new Date(parsed);
  }

  // ======================================================
  // 📥 IMPORTADOR DE PRESUPUESTO
  // ======================================================

  async importBudget(filePath: string): Promise<ImportBudgetResult> {
    const start = Date.now();

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    const projects = new Map<
      string,
      { name: string; capTotal: number; expTotal: number }
    >();

    let linesTotal = 0;
    let linesValid = 0;
    let linesIgnored = 0;

    let capTotal = 0;
    let expTotal = 0;

    for await (const rawLine of rl) {
      linesTotal++;

      const line = rawLine.trim();

      if (!line.startsWith('LCP-')) {
        linesIgnored++;
        continue;
      }

      const [lcpCode, name, , , amountRaw] = line.split('\t');

      if (!lcpCode || !name || !amountRaw) {
        linesIgnored++;
        continue;
      }

      const amount = this.parseAmount(amountRaw);

      if (amount === 0) {
        linesIgnored++;
        continue;
      }

      linesValid++;

      const mainCode = this.parseCode(lcpCode);
      const expense = this.isExpense(lcpCode);

      if (!projects.has(mainCode)) {
        projects.set(mainCode, { name, capTotal: 0, expTotal: 0 });
      }

      const project = projects.get(mainCode)!;

      if (expense) {
        project.expTotal += amount;
        expTotal += amount;
      } else {
        project.capTotal += amount;
        capTotal += amount;
      }
    }

    const operations = [...projects].map(([lcpCode, data]) =>
      this.prisma.project.upsert({
        where: { lcpCode },
        update: data,
        create: { lcpCode, ...data },
      }),
    );

    const chunkSize = 500;

    for (let i = 0; i < operations.length; i += chunkSize) {
      await this.prisma.$transaction(operations.slice(i, i + chunkSize));
    }

    const processingTimeMs = Date.now() - start;

    const result: ImportBudgetResult = {
      linesTotal,
      linesValid,
      linesIgnored,
      projectsDetected: projects.size,
      databaseOperations: operations.length,
      capTotal,
      expTotal,
      processingTimeMs,
    };

    this.logger.log(`Import result: ${JSON.stringify(result)}`);

    return result;
  }

  // ______           _            _     _____ _______   __
  // | ___ \         | |          | |   |  ___|  ___\ \ / /
  // | |_/ /_   _  __| | __ _  ___| |_  | |__ | |__  \ V /
  // | ___ \ | | |/ _` |/ _` |/ _ \ __| |  __||  __| /   \
  // | |_/ / |_| | (_| | (_| |  __/ |_  | |___| |___/ /^\ \
  // \____/ \__,_|\__,_|\__, |\___|\__| \____/\____/\/   \/
  //                     __/ |
  //                    |___/

  async importBudgetEEX(filePath: string): Promise<ImportBudgetResult> {
    const start = Date.now();

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    const projects = new Map<
      string,
      { name: string; capTotal: number; expTotal: number }
    >();

    let linesTotal = 0;
    let linesValid = 0;
    let linesIgnored = 0;

    let capTotal = 0;
    let expTotal = 0;

    for await (const rawLine of rl) {
      linesTotal++;

      const line = rawLine.trim();

      if (!line.startsWith('EEX-')) {
        linesIgnored++;
        continue;
      }

      const [lcpCode, name, , , amountRaw] = line.split('\t');

      if (!lcpCode || !name || !amountRaw) {
        linesIgnored++;
        continue;
      }

      const amount = this.parseAmount(amountRaw);

      if (amount === 0) {
        linesIgnored++;
        continue;
      }

      linesValid++;

      const mainCode = this.parseCode(lcpCode);
      const expense = this.isExpense(lcpCode);

      if (!projects.has(mainCode)) {
        projects.set(mainCode, { name, capTotal: 0, expTotal: 0 });
      }

      const project = projects.get(mainCode)!;

      if (!expense) {
        project.expTotal += amount;
        expTotal += amount;
      } else {
        project.capTotal += amount;
        capTotal += amount;
      }
    }

    const operations = [...projects].map(([lcpCode, data]) =>
      this.prisma.project.upsert({
        where: { lcpCode },
        update: data,
        create: { lcpCode, ...data },
      }),
    );

    const chunkSize = 500;

    for (let i = 0; i < operations.length; i += chunkSize) {
      await this.prisma.$transaction(operations.slice(i, i + chunkSize));
    }

    const processingTimeMs = Date.now() - start;

    const result: ImportBudgetResult = {
      linesTotal,
      linesValid,
      linesIgnored,
      projectsDetected: projects.size,
      databaseOperations: operations.length,
      capTotal,
      expTotal,
      processingTimeMs,
    };

    this.logger.log(`Import result: ${JSON.stringify(result)}`);

    return result;
  }

  // ======================================================
  // 📥 IMPORTADOR DE GASTOS REALES (SIN DUPLICADOS)
  // ======================================================

  async importReal(filePath: string): Promise<void> {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    // LCP → gastos del archivo
    const real = new Map<
      string,
      {
        gastos: {
          expDescription: string;
          amount: number;
          currency: string;
          PO: string;
          purchaseDate: string;
        }[];
      }
    >();

    // 1️⃣ Leer archivo
    for await (const rawLine of rl) {
      const line = rawLine.trim();
      if (!line.startsWith('LCP-')) continue;

      const [
        lcpCode,
        ,
        expDescription,
        amountRaw,
        currency,
        PO,
        ,
        purchaseDate,
      ] = line.split('\t');

      const amount = this.parseAmount(amountRaw);
      if (amount === 0) continue;

      const mainCode = this.parseCode(lcpCode);

      if (!real.has(mainCode)) real.set(mainCode, { gastos: [] });

      real.get(mainCode)!.gastos.push({
        expDescription,
        amount,
        currency,
        PO,
        purchaseDate,
      });
    }

    // 2️⃣ Obtener proyectos
    const projects = await this.prisma.project.findMany({
      where: { lcpCode: { in: [...real.keys()] } },
      select: { id: true, lcpCode: true },
    });

    const projectIdMap = new Map(projects.map((p) => [p.lcpCode, p.id]));

    // 3️⃣ Obtener gastos existentes SOLO de esos proyectos
    const existingReals = await this.prisma.real.findMany({
      where: {
        projectId: { in: projects.map((p) => p.id) },
      },
      select: {
        projectId: true,
        expDescription: true,
        amount: true,
        currency: true,
        purchaseOrder: true,
      },
    });

    const existingSet = new Set(
      existingReals.map(
        (r) => `${r.projectId}|${r.amount}|${r.currency}|${r.expDescription}`,
      ),
    );

    // 4️⃣ Construir filas nuevas
    const rows: {
      projectId: number;
      expDescription: string;
      amount: number;
      currency: string;
      purchaseOrder: string;
    }[] = [];

    for (const [lcpCode, data] of real) {
      const projectId = projectIdMap.get(lcpCode);
      if (!projectId) continue;

      for (const gasto of data.gastos) {
        const key = `${projectId}|${gasto.amount}|${gasto.currency}|${gasto.expDescription}`;
        if (existingSet.has(key)) continue;

        rows.push({
          projectId,
          expDescription: gasto.expDescription,
          amount: gasto.amount,
          currency: gasto.currency,
          purchaseOrder: gasto.PO,
        });
      }
    }

    // 5️⃣ Insertar en batches
    const BATCH_SIZE = 300;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await this.prisma.real.createMany({
        data: rows.slice(i, i + BATCH_SIZE),
      });
    }

    this.logger.log(`Gastos nuevos importados: ${rows.length}`);
  }

  // ======================================================
  // 📥 IMPORTADOR DE GASTOS REALES EEX (SIN DUPLICADOS)
  // ======================================================

  async importRealEEX(filePath: string): Promise<void> {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    // LCP → gastos del archivo
    const real = new Map<
      string,
      {
        gastos: {
          expDescription: string;
          amount: number;
          currency: string;
          PO: string;
          purchaseDate: string;
        }[];
      }
    >();

    // 1️⃣ Leer archivo
    for await (const rawLine of rl) {
      const line = rawLine.trim();
      if (!line.startsWith('EEX-')) continue;

      const [
        lcpCode,
        ,
        expDescription,
        ,
        amountRaw,
        currency,
        PO,
        ,
        purchaseDate,
      ] = line.split('\t');

      console.log({
        lcpCode,
        expDescription,
        amountRaw,
        currency,
        PO,
        purchaseDate,
      });

      const amount = this.parseAmount(amountRaw);
      if (amount === 0) continue;

      const mainCode = this.parseCode(lcpCode);

      if (!real.has(mainCode)) real.set(mainCode, { gastos: [] });

      real.get(mainCode)!.gastos.push({
        expDescription,
        amount,
        currency,
        PO,
        purchaseDate,
      });
    }

    // 2️⃣ Obtener proyectos
    const projects = await this.prisma.project.findMany({
      where: { lcpCode: { in: [...real.keys()] } },
      select: { id: true, lcpCode: true },
    });

    const projectIdMap = new Map(projects.map((p) => [p.lcpCode, p.id]));

    // 3️⃣ Obtener gastos existentes SOLO de esos proyectos
    const existingReals = await this.prisma.real.findMany({
      where: {
        projectId: { in: projects.map((p) => p.id) },
      },
      select: {
        projectId: true,
        expDescription: true,
        amount: true,
        currency: true,
        purchaseOrder: true,
      },
    });

    const existingSet = new Set(
      existingReals.map(
        (r) => `${r.projectId}|${r.amount}|${r.currency}|${r.expDescription}`,
      ),
    );

    // 4️⃣ Construir filas nuevas
    const rows: {
      projectId: number;
      expDescription: string;
      amount: number;
      currency: string;
      purchaseOrder: string;
    }[] = [];

    for (const [lcpCode, data] of real) {
      const projectId = projectIdMap.get(lcpCode);
      if (!projectId) continue;

      for (const gasto of data.gastos) {
        const key = `${projectId}|${gasto.amount}|${gasto.currency}|${gasto.expDescription}`;
        if (existingSet.has(key)) continue;

        rows.push({
          projectId,
          expDescription: gasto.expDescription,
          amount: gasto.amount,
          currency: gasto.currency,
          purchaseOrder: gasto.PO,
        });
      }
    }

    // 5️⃣ Insertar en batches
    const BATCH_SIZE = 300;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await this.prisma.real.createMany({
        data: rows.slice(i, i + BATCH_SIZE),
      });
    }

    this.logger.log(`Gastos nuevos importados: ${rows.length}`);
  }

  // ======================================================
  // 📥 IMPORTADOR DE GASTOS COMPROMETIDOS (SIN DUPLICADOS)
  // ======================================================
  async importComprometido(filePath: string): Promise<void> {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    // LCP → lista de comprometidos
    const comprometido = new Map<
      string,
      {
        comprometido: {
          refDoc: string;
          descripcion: string;
          amount: number;
          currency: string;
          docDate?: Date;
        }[];
      }
    >();

    // =============================
    // 1️⃣ Leer archivo y agrupar
    // =============================
    for await (const rawLine of rl) {
      const line = rawLine.trim();

      if (!line.includes('LCP-')) continue;

      const cols = line.split('\t');

      const lcpCode = cols[3]?.trim();
      const docDate = cols[1]?.trim();
      const refDoc = cols[6]?.trim();
      const descripcion = cols[9]?.trim();
      const amountRaw = cols[12]?.trim();
      const currency = cols[14]?.trim();

      if (!lcpCode || !amountRaw) continue;

      const amount = this.parseAmount(amountRaw);
      if (amount === 0) continue;

      const mainCode = this.parseCode(lcpCode);

      if (!comprometido.has(mainCode)) {
        comprometido.set(mainCode, { comprometido: [] });
      }

      comprometido.get(mainCode)!.comprometido.push({
        refDoc,
        descripcion,
        amount,
        currency,
        docDate: this.parseDate(docDate) || undefined,
      });
    }

    // =============================
    // 2️⃣ Obtener proyectos existentes
    // =============================
    const projects = await this.prisma.project.findMany({
      where: { lcpCode: { in: [...comprometido.keys()] } },
      select: { id: true, lcpCode: true },
    });

    const projectIdMap = new Map(projects.map((p) => [p.lcpCode, p.id]));

    // =============================
    // 3️⃣ Preparar filas para insert
    // (aquí solo construimos, no insertamos aún)
    // =============================
    const rows: {
      projectId: number;
      refDoc: string;
      descripcion: string;
      amount: number;
      currency: string;
      docDate?: Date;
    }[] = [];

    for (const [lcpCode, data] of comprometido) {
      const projectId = projectIdMap.get(lcpCode);
      if (!projectId) continue;

      for (const c of data.comprometido) {
        rows.push({
          projectId,
          refDoc: c.refDoc,
          descripcion: c.descripcion,
          amount: c.amount,
          currency: c.currency,
          docDate: c.docDate,
        });
      }
    }

    // =============================
    // 4️⃣ Obtener existentes SOLO de esos proyectos
    // =============================
    const existing = await this.prisma.comprometido.findMany({
      where: {
        projectId: { in: projects.map((p) => p.id) },
      },
      select: {
        projectId: true,
        refDoc: true,
        amount: true,
        currency: true,
      },
    });

    const existingSet = new Set(
      existing.map(
        (e) => `${e.projectId}|${e.refDoc}|${e.amount}|${e.currency}`,
      ),
    );

    // =============================
    // 5️⃣ Filtrar solo nuevos
    // =============================
    const newRows = rows.filter((r) => {
      const key = `${r.projectId}|${r.refDoc}|${r.amount}|${r.currency}`;
      return !existingSet.has(key);
    });

    if (newRows.length === 0) {
      this.logger.log('No hay nuevos comprometidos para insertar.');
      return;
    }

    // =============================
    // 6️⃣ Insertar en batches
    // =============================
    const BATCH_SIZE = 300;

    for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
      await this.prisma.comprometido.createMany({
        data: newRows.slice(i, i + BATCH_SIZE),
      });
    }

    this.logger.log(`Comprometidos nuevos insertados: ${newRows.length}`);
  }

  // ======================================================
  // 📥 IMPORTADOR DE GASTOS COMPROMETIDOS EEX (SIN DUPLICADOS)
  // ======================================================
  async importComprometidoEEX(filePath: string): Promise<void> {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    });

    // LCP → lista de comprometidos
    const comprometido = new Map<
      string,
      {
        comprometido: {
          refDoc: string;
          descripcion: string;
          amount: number;
          currency: string;
          docDate?: Date;
        }[];
      }
    >();

    // =============================
    // 1️⃣ Leer archivo y agrupar
    // =============================
    for await (const rawLine of rl) {
      const line = rawLine.trim();

      if (!line.includes('EEX-')) continue;

      const cols = line.split('\t');

      const lcpCode = cols[3]?.trim();
      const docDate = cols[1]?.trim();
      const refDoc = cols[6]?.trim();
      const descripcion = cols[9]?.trim();
      const amountRaw = cols[12]?.trim();
      const currency = cols[14]?.trim();

      if (!lcpCode || !amountRaw) continue;

      const amount = this.parseAmount(amountRaw);
      if (amount === 0) continue;

      const mainCode = this.parseCode(lcpCode);

      if (!comprometido.has(mainCode)) {
        comprometido.set(mainCode, { comprometido: [] });
      }

      comprometido.get(mainCode)!.comprometido.push({
        refDoc,
        descripcion,
        amount,
        currency,
        docDate: this.parseDate(docDate) || undefined,
      });
    }

    // =============================
    // 2️⃣ Obtener proyectos existentes
    // =============================
    const projects = await this.prisma.project.findMany({
      where: { lcpCode: { in: [...comprometido.keys()] } },
      select: { id: true, lcpCode: true },
    });

    const projectIdMap = new Map(projects.map((p) => [p.lcpCode, p.id]));

    // =============================
    // 3️⃣ Preparar filas para insert
    // (aquí solo construimos, no insertamos aún)
    // =============================
    const rows: {
      projectId: number;
      refDoc: string;
      descripcion: string;
      amount: number;
      currency: string;
      docDate?: Date;
    }[] = [];

    for (const [lcpCode, data] of comprometido) {
      const projectId = projectIdMap.get(lcpCode);
      if (!projectId) continue;

      for (const c of data.comprometido) {
        rows.push({
          projectId,
          refDoc: c.refDoc,
          descripcion: c.descripcion,
          amount: c.amount,
          currency: c.currency,
          docDate: c.docDate,
        });
      }
    }

    // =============================
    // 4️⃣ Obtener existentes SOLO de esos proyectos
    // =============================
    const existing = await this.prisma.comprometido.findMany({
      where: {
        projectId: { in: projects.map((p) => p.id) },
      },
      select: {
        projectId: true,
        refDoc: true,
        amount: true,
        currency: true,
      },
    });

    const existingSet = new Set(
      existing.map(
        (e) => `${e.projectId}|${e.refDoc}|${e.amount}|${e.currency}`,
      ),
    );

    // =============================
    // 5️⃣ Filtrar solo nuevos
    // =============================
    const newRows = rows.filter((r) => {
      const key = `${r.projectId}|${r.refDoc}|${r.amount}|${r.currency}`;
      return !existingSet.has(key);
    });

    if (newRows.length === 0) {
      this.logger.log('No hay nuevos comprometidos para insertar.');
      return;
    }

    // =============================
    // 6️⃣ Insertar en batches
    // =============================
    const BATCH_SIZE = 300;

    for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
      await this.prisma.comprometido.createMany({
        data: newRows.slice(i, i + BATCH_SIZE),
      });
    }

    this.logger.log(`Comprometidos nuevos insertados: ${newRows.length}`);
  }

  // ======================================================
  // CRUD BÁSICO (sin cambios)
  // ======================================================

  findAll() {
    return this.prisma.project.findMany();
  }

  findOneByLcpCode(lcpCode: string) {
    return this.prisma.project.findUnique({ where: { lcpCode } });
  }

  findOneByLcpCodeGastos(lcpCode: string) {
    return this.prisma.project.findUnique({
      where: { lcpCode },
      include: { reals: true },
    });
  }

  findOneByLcpCodeComprometido(lcpCode: string) {
    return this.prisma.project.findUnique({
      where: { lcpCode },
      include: { comprometidos: true },
    });
  }

  async getStats() {
    const [totalProjects, totalGastos, totalComprometidos, totalAbiertos] =
      await Promise.all([
        this.prisma.project.count(),
        this.prisma.real.aggregate({ _sum: { amount: true } }),
        this.prisma.comprometido.aggregate({ _sum: { amount: true } }),
        this.prisma.project.aggregate({
          where: { status: 'ABIERTO' },
          _count: true,
        }),
      ]);
    return {
      totalProjects,
      totalGastos: totalGastos._sum.amount || 0,
      totalComprometidos: totalComprometidos._sum.amount || 0,
      totalAbiertos: totalAbiertos._count,
    };
  }

  async updateStatus(id: number, status: ProjectStatus) {
    return this.prisma.project.update({
      where: { id },
      data: { status },
    });
  }

  async updateEngineer(id: number, projectEngineer: string) {
    return this.prisma.project.update({
      where: { id },
      data: { projectEngineer },
    });
  }
}
