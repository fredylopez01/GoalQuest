export class PaginationMeta {
  page!: number;
  limit!: number;
  total!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  pagination!: PaginationMeta;
}
