import { IsNotEmpty, IsString, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';

export class CreateHarvestDto {
  @IsNotEmpty({ message: 'O nome da safra é obrigatório.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O ano da safra é obrigatório.' })
  @IsInt({ message: 'O ano deve ser um número inteiro.' })
  @Min(2000, { message: 'O ano deve ser no mínimo 2000.' })
  @Max(2100, { message: 'O ano deve ser no máximo 2100.' })
  year: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty({ message: 'O ID da fazenda é obrigatório.' })
  @IsString()
  farmId: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data de início deve ser uma data válida.' })
  start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data de fim deve ser uma data válida.' })
  end_date?: string;
}
