import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Api } from "../Api.js"
import { UserService, UserserviceLive } from "./Service.js"
import { PrismaServiceLive } from "app/common/PrismaService"
import { Authentication } from "./Api.js"

export const HttpUsersLive = HttpApiBuilder.group(
    Api,
    "apiServer/src/users/usersApi",
    (handlers) =>
        Effect.gen(function*() {
            const userService = yield* UserService
            return handlers
                .handle("createUser", ({ payload }) =>
                    userService.createUser(payload.username, payload.password)
                )
                .handle("signin", ({ payload }) =>
                    userService.signin(payload.username, payload.password).pipe(
                        Effect.tap((user) =>
                            HttpApiBuilder.securitySetCookie(
                                Authentication.security.cookie,
                                user.accessToken,
                                { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) }
                            )
                        )
                    )
                )
        })
).pipe(
    Layer.provide(UserserviceLive),
    Layer.provide(PrismaServiceLive),
)
