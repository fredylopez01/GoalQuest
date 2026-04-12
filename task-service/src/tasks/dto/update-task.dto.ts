import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DifficultyLevel } from '@prisma/client';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Nombre de la tarea',
    example: 'Leer 45 minutos',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Nivel de dificultad',
    enum: DifficultyLevel,
    example: 'high',
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Fecha límite (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsString()
  limitDate?: string | null;

  @ApiPropertyOptional({
    description: 'Frecuencia (0 = única, >0 = recurrente)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  frequency?: number;
}
