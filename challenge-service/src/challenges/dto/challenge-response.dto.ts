export class ChallengeResponseDto {
  id!: string;
  challengerId!: string;
  challengerName!: string;
  opponentId!: string;
  opponentName!: string;
  condition!: string;
  state!: string;
  durationDays!: number;
  startDate!: string | null;
  endDate!: string | null;
  daysRemaining!: number | null;
  result!: string | null;
  myRole!: string;
  createdAt!: string;
}
