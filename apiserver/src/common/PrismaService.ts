import { Context, Layer } from "effect";
import { PrismaClient } from "../generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg"

export class PrismaService extends Context.Tag("http-server/common/PrismaService")<PrismaService, PrismaClient>() { }

export const PrismaServiceLive = Layer.sync(
    PrismaService,
    () => {
        const connectionString = process.env.DATABASE_URL;
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    }
)
