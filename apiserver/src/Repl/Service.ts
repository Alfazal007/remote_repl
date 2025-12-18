import { PrismaService } from "app/common/PrismaService"
import { Context, Effect, Layer } from "effect"
import { GeneralError, InternalError, NotFoundError } from "app/common/CommonError"
import { CreateReplResponseSchemaType, CreateReplResponseSchema } from "./Schema.js"
import { HelperService } from "app/common/HelperService"
import { S3Service } from "app/common/S3Client"
import { RedisService } from "app/common/RedisService"

interface ReplserviceInterface {
    createRepl: (typeOfRepl: "NODE" | "RUST", userId: number) =>
        Effect.Effect<CreateReplResponseSchemaType, InternalError | GeneralError, HelperService | S3Service>,

    startRepl: (replId: number, userId: number) =>
        Effect.Effect<void, InternalError | GeneralError | NotFoundError>,

    deleteRepl: (replId: number, userId: number) =>
        Effect.Effect<void, InternalError | GeneralError | NotFoundError, HelperService | S3Service>,
}

export class ReplService extends Context.Tag(
    "http-server/Repl/Service/ReplService"
)<ReplService, ReplserviceInterface>() { }

export const ReplserviceLive = Layer.effect(ReplService,
    Effect.gen(function*() {
        const prismaClient = yield* PrismaService
        const redisClient = yield* RedisService
        const helperService = yield* HelperService

        return {
            createRepl(typeOfRepl, userId) {
                return Effect.gen(function*() {
                    const dbResult = yield* Effect.tryPromise({
                        try: () => prismaClient.repl.create({
                            data: {
                                type: typeOfRepl,
                                authorId: userId
                            }
                        }),
                        catch: (databaseErr) => {
                            console.log("Issue checking uniqueness of username", { databaseErr: String(databaseErr) })
                            return { error: "Issue talking to the database", type: "INTERNAL" } as InternalError
                        }
                    })
                    yield* helperService.copyWithinS3(`${userId}/${dbResult.id}`, typeOfRepl)
                    return { replId: dbResult.id } as typeof CreateReplResponseSchema.Type
                })
            },

            startRepl(replId, userId) {
                return Effect.gen(function*() {
                    const dbResult = yield* Effect.tryPromise({
                        try: () => prismaClient.repl.findFirst({
                            where: {
                                AND: [
                                    {
                                        authorId: userId
                                    },
                                    {
                                        id: replId
                                    }
                                ]
                            }
                        }),
                        catch: (databaseErr) => {
                            console.log("Issue checking uniqueness of username", { databaseErr: String(databaseErr) })
                            return { error: "Issue talking to the database", type: "INTERNAL" } as InternalError
                        }
                    })
                    if (!dbResult) {
                        return yield* Effect.fail({ error: "No such repl", type: "NOTFOUND" } as NotFoundError)
                    }
                    // NOTE:: THE SERVICE THAT SETS THIS TO TRUE IS THE ONE THAT POPS IT OUT OF THE QUEUE AND IF ALREADY HASSTARTED THEN PUT IT TO THE END OF THE QUEUE AGAIN
                    if (dbResult.state != "STOPPED") {
                        return yield* Effect.fail({ error: "Only one can access this at a time wait for termination of the other side", type: "GENERAL" } as GeneralError)
                    }
                    yield* Effect.tryPromise({
                        try: () => redisClient.lPush(dbResult.type, JSON.stringify({ "repoId": dbResult.id })),
                        catch: (err) => {
                            console.log("Issue checking uniqueness of username", { redisError: String(err) })
                            return { error: "Issue talking to redis", type: "INTERNAL" } as InternalError
                        }
                    })
                    return
                })
            },

            deleteRepl(replId, userId) {
                return Effect.gen(function*() {
                    const dbResult = yield* Effect.tryPromise({
                        try: () => prismaClient.repl.deleteMany({
                            where: {
                                AND: [
                                    {
                                        authorId: userId
                                    },
                                    {
                                        id: replId
                                    }
                                ]
                            }
                        }),
                        catch: (databaseErr) => {
                            console.log("Issue checking uniqueness of username", { databaseErr: String(databaseErr) })
                            return { error: "Issue talking to the database", type: "INTERNAL" } as InternalError
                        }
                    })
                    if (!dbResult) {
                        return yield* Effect.fail({ error: "No such repl", type: "NOTFOUND" } as NotFoundError)
                    }
                    if (dbResult.count == 0) {
                        return
                    }
                    yield* helperService.deleteFromS3(`implementation/${userId}/${replId}/`)
                    return
                })
            }
        }
    })
)
