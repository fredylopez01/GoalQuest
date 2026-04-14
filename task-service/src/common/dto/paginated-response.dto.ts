import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 50 })
  total!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];

  @ApiProperty({ type: PaginationDto })
  pagination!: PaginationDto;
}
