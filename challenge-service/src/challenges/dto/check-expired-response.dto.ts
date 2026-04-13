export class ExpiredChallengeResult {
  challengeId!: string;
  result!: string;
  winnerId!: string;
  loserId!: string;
}

export class CheckExpiredResponseDto {
  processed!: number;
  results!: ExpiredChallengeResult[];
}
