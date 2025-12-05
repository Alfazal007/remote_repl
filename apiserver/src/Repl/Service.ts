import { PrismaService } from "app/common/PrismaService"
import { Context, Effect, Layer } from "effect"
import { GeneralError, InternalError } from "app/common/CommonError"
import { CreateReplResponseSchemaType, CreateReplResponseSchema } from "./Schema.js"
import { CurrentUser } from "app/Users/User"

interface ReplserviceInterface {
    createRepl: (typeOfRepl: "NODE" | "RUST") =>
        Effect.Effect<CreateReplResponseSchemaType, InternalError | GeneralError, CurrentUser>,
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
                    // TODO:: copy the repl on r2
                    if (typeOfRepl == null) {
                        return yield* Effect.fail({ error: "Issue talking to the database", type: "GENERAL" } as GeneralError)
                    }

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
                    return { replId: dbResult.id } as typeof CreateReplResponseSchema.Type
                })
            }
        }
    })
)
