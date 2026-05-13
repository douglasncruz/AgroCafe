import { Controller, Get, Post, Body, Param, UseGuards, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AgrochemicalsService } from './agrochemicals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

@Controller('api/agrochemicals')
@UseGuards(JwtAuthGuard)
export class AgrochemicalsController {
  constructor(private readonly service: AgrochemicalsService) {}

  @Get()
  findAll(@Query('farmId') farmId: string) {
    if(!farmId) return [];
    return this.service.findAll(farmId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('receipt', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        return cb(new Error('Formato inválido. Envie apenas PDF ou Imagens.'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  }))
  create(@Body() dto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      dto.recipe_url = `/uploads/${file.filename}`;
    }
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
