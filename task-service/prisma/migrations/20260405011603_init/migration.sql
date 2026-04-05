-- CreateEnum
CREATE TYPE "StateGoal" AS ENUM ('pending', 'completed', 'expired');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('easy', 'middle', 'high');

-- CreateTable
CREATE TABLE "goals" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "end_date" TIMESTAMP(3),
    "state" "StateGoal" NOT NULL DEFAULT 'pending',
    "max_days_later" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" SERIAL NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "state" "StateGoal" NOT NULL DEFAULT 'pending',
    "difficulty_level" "DifficultyLevel" NOT NULL,
    "limit_date" TIMESTAMP(3),
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_completions" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_completions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
