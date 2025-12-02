import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Api } from "../Api.js"
import { UserService, UserserviceLive } from "./Service.js"
import { PrismaServiceLive } from "app/common/PrismaService"

export const HttpUsersLive = HttpApiBuilder.group(
    Api,
    "apiServer/src/users/usersApi",
    (handlers) =>
        Effect.gen(function*() {
            const userService = yield* UserService
            return handlers
                .handle("createUser", ({ payload }) =>
                    Effect.gen(function*() {
                        return yield* userService.createUser(payload.username, payload.password)
                    }))
        })
).pipe(
    Layer.provide(UserserviceLive),
    Layer.provide(PrismaServiceLive),
)
