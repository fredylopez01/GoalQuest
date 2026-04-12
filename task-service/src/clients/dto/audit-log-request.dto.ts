export class AuditLogRequestDto {
  user_id!: string;
  action!: string;
  description!: string;
  ip_address!: string | null;
}