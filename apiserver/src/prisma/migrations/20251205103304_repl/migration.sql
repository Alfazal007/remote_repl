-- CreateEnum
CREATE TYPE "TypeOfRepl" AS ENUM ('NODE', 'RUST');

-- CreateTable
CREATE TABLE "Repl" (
    "id" SERIAL NOT NULL,
    "type" "TypeOfRepl" NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "Repl_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Repl" ADD CONSTRAINT "Repl_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
