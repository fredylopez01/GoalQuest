import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ChallengeCondition } from '../enums/challenge-condition.enum';

export class CreateChallengeDto {
  @IsNotEmpty()
  @IsUUID()
  opponentId!: string;

  @IsNotEmpty()
  @IsEnum(ChallengeCondition, {
    message: `condition must be one of: ${Object.values(ChallengeCondition).join(', ')}`,
  })
  condition!: ChallengeCondition;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  durationDays!: number;
}
