import { PrismaService } from "app/common/PrismaService"
import { Context, Effect, Layer } from "effect"
import { GeneralError, InternalError, NotFoundError } from "app/common/CommonError"
import { CreateReplResponseSchemaType, CreateReplResponseSchema } from "./Schema.js"
import { CurrentUser } from "app/Users/User"
import { HelperService } from "app/common/HelperService"
import { S3Service } from "app/common/S3Client"

interface ReplserviceInterface {
    createRepl: (typeOfRepl: "NODE" | "RUST") =>
        Effect.Effect<CreateReplResponseSchemaType, InternalError | GeneralError, CurrentUser | HelperService | S3Service>,

    startRepl: (replId: number) =>
        Effect.Effect<CreateReplResponseSchemaType, InternalError | GeneralError | NotFoundError, CurrentUser | HelperService | S3Service>,
}

export class ReplService extends Context.Tag(
    "http-server/Repl/Service/ReplService"
)<ReplService, ReplserviceInterface>() { }

export const ReplserviceLive = Layer.effect(ReplService,
    Effect.gen(function*() {
        const prismaClient = yield* PrismaService

        return {
            createRepl(typeOfRepl) {
                return Effect.gen(function*() {
                    const currentUser = yield* CurrentUser
                    const helperService = yield* HelperService
                    const dbResult = yield* Effect.tryPromise({
                        try: () => prismaClient.repl.create({
                            data: {
                                type: typeOfRepl,
                                authorId: currentUser.id
                            }
                        }),
                        catch: (databaseErr) => {
                            console.log("Issue checking uniqueness of username", { databaseErr: String(databaseErr) })
                            return { error: "Issue talking to the database", type: "INTERNAL" } as InternalError
                        }
                    })
                    yield* helperService.copyWithinS3(`${currentUser.id}/${dbResult.id}`, typeOfRepl)
                    return { replId: dbResult.id } as typeof CreateReplResponseSchema.Type
                })
            },

            startRepl(replId) {
                return Effect.gen(function*() {
                    const currentUser = yield* CurrentUser
                    // TODO:: write docker logic here
                    // const helperService = yield* HelperService

                    const dbResult = yield* Effect.tryPromise({
                        try: () => prismaClient.repl.findFirst({
                            where: {
                                AND: [
                                    {
                                        authorId: currentUser.id
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

                    return { replId: dbResult.id } as typeof CreateReplResponseSchema.Type
                })
            }
        }
    })
)
