import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UploadedFile, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MachinesService } from './machines.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/machines')
@UseGuards(JwtAuthGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  findAllMachines() {
    return this.machinesService.findAllMachines();
  }

  @Post()
  createMachine(@Body() dto: any) {
    return this.machinesService.createMachine(dto);
  }

  @Delete(':id')
  removeMachine(@Param('id') id: string) {
    return this.machinesService.removeMachine(id);
  }

  @Get('maintenances')
  findAllMaintenances() {
    return this.machinesService.findAllMaintenances();
  }

  @Post('maintenances')
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
  createMaintenance(@Body() dto: any, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      dto.receipt_url = `/uploads/${file.filename}`;
    }
    return this.machinesService.createMaintenance(dto);
  }

  @Delete('maintenances/:id')
  removeMaintenance(@Param('id') id: string) {
    return this.machinesService.removeMaintenance(id);
  }
}
