import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class FilterCompletionsDto {
  @ApiProperty({
    description: 'Fecha inicio (ISO date)',
    example: '2025-06-01',
  })
  @IsString()
  @IsNotEmpty()
  from!: string;

  @ApiProperty({
    description: 'Fecha fin (ISO date)',
    example: '2025-06-30',
  })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tarea específica',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  taskId?: number;
}
