import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsNotEmpty()
  @IsUUID()
  user_id!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  tasks_completed_today!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  total_tasks_today!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  xp_earned!: number;
}
