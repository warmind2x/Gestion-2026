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
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // =============================
  // IMPORTAR ARCHIVO TSV
  // =============================
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
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
  // CRUD NORMAL
  // =============================
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }
}
