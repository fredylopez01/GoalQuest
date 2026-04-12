import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { StateGoal } from '@prisma/client';

export class FilterTasksDto {
  @ApiPropertyOptional({ description: 'Filtrar por meta', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  goalId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: StateGoal,
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(StateGoal)
  state?: StateGoal;

  @ApiPropertyOptional({ description: 'Filtrar por frecuencia', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  frequency?: number;

  @ApiPropertyOptional({
    description: 'Filtrar tareas activas para una fecha (ISO date)',
    example: '2025-06-15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad por página',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
