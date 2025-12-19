-- CreateEnum
CREATE TYPE "StateOfRepl" AS ENUM ('STOPPED', 'USINGUSER', 'MERGINGBE');

-- AlterTable
ALTER TABLE "Repl" ADD COLUMN     "state" "StateOfRepl" NOT NULL DEFAULT 'STOPPED';
