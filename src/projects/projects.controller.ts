import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectStatus } from '../generated/prisma/client';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // =============================
  // IMPORTAR PRESUPUESTO TSV
  // =============================
  @Post('importBudget')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 500 MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importBudget(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    if (!file) {
      throw new BadRequestException('Archivo no recibido');
    }

    const tempDir = path.join(process.cwd(), 'tmp');
    const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Escritura temporal del archivo
      await fs.promises.writeFile(tempPath, file.buffer);

      // Procesamiento real (stream dentro del service)
      await this.projectsService.importBudget(tempPath);

      return { message: 'Archivo importado correctamente' };
    } finally {
      // Limpieza garantizada
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  // =============================
  // IMPORTAR REAL TSV
  // =============================

  @Post('importReal')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 500 MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importReal(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    if (!file) {
      throw new BadRequestException('Archivo no recibido');
    }

    const tempDir = path.join(process.cwd(), 'tmp');
    const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Escritura temporal del archivo
      await fs.promises.writeFile(tempPath, file.buffer);

      // Procesamiento real (stream dentro del service)
      await this.projectsService.importReal(tempPath);

      return { message: 'Archivo importado correctamente' };
    } finally {
      // Limpieza garantizada
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  // =============================
  // IMPORTAR PRESUPUESTO TSV
  // =============================

  @Post('importComprometido')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 500 MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async importComprometido(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ message: string }> {
    if (!file) {
      throw new BadRequestException('Archivo no recibido');
    }

    const tempDir = path.join(process.cwd(), 'tmp');
    const tempPath = path.join(tempDir, `${Date.now()}-${file.originalname}`);

    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Escritura temporal del archivo
      await fs.promises.writeFile(tempPath, file.buffer);

      // Procesamiento real (stream dentro del service)
      await this.projectsService.importComprometido(tempPath);

      return { message: 'Archivo importado correctamente' };
    } finally {
      // Limpieza garantizada
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  // =============================
  // CRUD NORMAL
  // =============================

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':lcpCode')
  findOne(@Param('lcpCode') lcpCode: string) {
    return this.projectsService.findOneByLcpCode(lcpCode.toUpperCase());
  }

  @Get('gastos/:lcpCode')
  findOneGastos(@Param('lcpCode') lcpCode: string) {
    return this.projectsService.findOneByLcpCodeGastos(lcpCode.toUpperCase());
  }

  @Get('comprometido/:lcpCode')
  findOneComprometido(@Param('lcpCode') lcpCode: string) {
    return this.projectsService.findOneByLcpCodeComprometido(
      lcpCode.toUpperCase(),
    );
  }

  @Get('dashboard/stats')
  getStats() {
    return this.projectsService.getStats();
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ProjectStatus,
  ) {
    return this.projectsService.updateStatus(id, status);
  }
}
