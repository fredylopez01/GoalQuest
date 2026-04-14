import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChallengeProgressDocument = HydratedDocument<ChallengeProgress>;

@Schema({
  collection: 'challenge_progress',
  timestamps: { updatedAt: 'updatedAt', createdAt: false },
})
export class ChallengeProgress {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Challenge' })
  challengeId!: Types.ObjectId;

  @Prop({ required: true, type: String })
  userId!: string;

  @Prop({ type: Number, default: 0 })
  tasksCompleted!: number;

  @Prop({ type: Number, default: 0 })
  totalTasks!: number;

  @Prop({ type: Number, default: 0 })
  xpEarned!: number;

  updatedAt!: Date;
}

export const ChallengeProgressSchema =
  SchemaFactory.createForClass(ChallengeProgress);

// Índices
ChallengeProgressSchema.index({ challengeId: 1, userId: 1 }, { unique: true });
ChallengeProgressSchema.index({ userId: 1 });
