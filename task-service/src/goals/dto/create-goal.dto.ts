import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({
    description: 'Nombre de la meta',
    example: 'Aprender inglés',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción de la meta',
    example: 'Estudiar inglés todos los días durante 30 minutos',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Fecha límite de la meta (ISO 8601)',
    example: '2025-03-01',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Días máximos de tolerancia después de la fecha límite',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDaysLater?: number;
}
