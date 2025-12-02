import { PrismaService } from "app/common/PrismaService"
import { Context, Effect, Layer } from "effect"
import type { GeneralError, InternalError } from "app/common/CommonError"

interface UserserviceInterface {
    createUser: (username: string, password: string) =>
        Effect.Effect<{ id: number; username: string }, InternalError | GeneralError>
}

export class UserService extends Context.Tag(
    "http-server/Users/Service/UserService"
)<UserService, UserserviceInterface>() { }

export const UserserviceLive = Layer.effect(UserService,
    Effect.gen(function*() {
        const prismaClient = yield* PrismaService
        return {
            createUser(username, password) {
                return Effect.gen(
                    function*() {
                        const userExistsInDb = yield* Effect.tryPromise({
                            try: () => prismaClient.user.findFirst({ where: { username } }),
                            catch: (err) => ({ error: "Issue talking to the database", type: "INTERNAL" } as InternalError)
                        })
                        if (userExistsInDb) {
                            return yield* Effect.fail({ error: "Use a different username as this one is already taken", type: "GENERAL" } as GeneralError)
                        }
                        return { id: -1, username: "s" };
                    }
                );
            },
        }
    })
)
