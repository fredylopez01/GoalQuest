import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChallengeState } from '../enums/challenge-state.enum';

export enum ChallengeRole {
  CHALLENGER = 'challenger',
  OPPONENT = 'opponent',
  ALL = 'all',
}

export class QueryChallengesDto {
  @IsOptional()
  @IsEnum(ChallengeState)
  state?: ChallengeState;

  @IsOptional()
  @IsEnum(ChallengeRole)
  role?: ChallengeRole;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
