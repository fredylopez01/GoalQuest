import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DifficultyLevel } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ description: 'ID de la meta asociada', example: 1 })
  @IsInt()
  goalId!: number;

  @ApiProperty({
    description: 'Nombre de la tarea',
    example: 'Leer 30 minutos',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Nivel de dificultad',
    enum: DifficultyLevel,
    example: 'middle',
  })
  @IsEnum(DifficultyLevel)
  difficultyLevel!: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Fecha límite (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsString()
  limitDate?: string | null;

  @ApiProperty({
    description: 'Frecuencia (0 = única, >0 = recurrente)',
    example: 1,
  })
  @IsInt()
  @Min(0)
  frequency!: number;
}
