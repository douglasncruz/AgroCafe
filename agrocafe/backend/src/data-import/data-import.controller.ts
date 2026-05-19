import { Controller, Post, UseInterceptors, UploadedFile, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataImportService } from './data-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as multer from 'multer';

@Controller('data-import')
@UseGuards(JwtAuthGuard)
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('farmId') farmId: string
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado. Anexe a planilha XLSX.');
    }

    if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
      throw new BadRequestException('Apenas planilhas (XLSX, XLS, CSV) são permitidas.');
    }

    return this.dataImportService.importExcel(file.buffer, farmId);
  }
}
