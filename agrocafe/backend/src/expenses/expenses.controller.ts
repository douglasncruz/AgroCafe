import { Controller, Get, Post, Put, Body, UseGuards, UseInterceptors, UploadedFile, Req, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

@Controller('api/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll() {
    return this.expensesService.findAll();
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
  create(@Body() createExpenseDto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      createExpenseDto.receipt_url = `/uploads/${file.filename}`;
    }
    return this.expensesService.create(createExpenseDto);
  }

  @Put(':id')
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
  update(
    @Param('id') id: string,
    @Body() updateExpenseDto: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (file) {
      updateExpenseDto.receipt_url = `/uploads/${file.filename}`;
    }
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
