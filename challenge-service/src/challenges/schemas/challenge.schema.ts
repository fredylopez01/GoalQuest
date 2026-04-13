import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ChallengeCondition } from '../enums/challenge-condition.enum';
import { ChallengeResult } from '../enums/challenge-result.enum';
import { ChallengeState } from '../enums/challenge-state.enum';

export type ChallengeDocument = HydratedDocument<Challenge>;

@Schema({
  collection: 'challenges',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Challenge {
  @Prop({ required: true, type: String })
  challengerId!: string;

  @Prop({ required: true, type: String })
  opponentId!: string;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ChallengeCondition),
  })
  condition!: ChallengeCondition;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ChallengeState),
    default: ChallengeState.PENDING,
  })
  state!: ChallengeState;

  @Prop({ required: true, type: Number, min: 1 })
  durationDays!: number;

  @Prop({ type: Date, default: null })
  startDate!: Date | null;

  @Prop({ type: Date, default: null })
  endDate!: Date | null;

  @Prop({
    type: String,
    enum: Object.values(ChallengeResult),
    default: null,
  })
  result!: ChallengeResult | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);

// Índices
ChallengeSchema.index({ challengerId: 1, state: 1 });
ChallengeSchema.index({ opponentId: 1, state: 1 });
ChallengeSchema.index({ state: 1, endDate: 1 });
ChallengeSchema.index(
  { challengerId: 1, opponentId: 1, state: 1 },
  { name: 'active_challenge_pair' },
);
