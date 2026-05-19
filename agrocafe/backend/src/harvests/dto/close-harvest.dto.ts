import { IsOptional, IsString } from 'class-validator';

export class CloseHarvestDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
