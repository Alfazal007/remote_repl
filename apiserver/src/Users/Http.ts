import { HttpApiBuilder } from "@effect/platform"
import { Config, Effect, Layer, Redacted } from "effect"
import { Api } from "../Api.js"
import { UserService, UserserviceLive } from "./Service.js"
import { PrismaServiceLive } from "app/common/PrismaService"
import { Authentication } from "./Api.js"
import { Unauthorized } from "@effect/platform/HttpApiError"
import { CurrentUser } from "./User.js"
import { RedisService, RedisServiceLive } from "app/common/RedisService"
import jsonwebtoken, { JwtPayload } from "jsonwebtoken"
import { InternalError } from "app/common/CommonError"

export const AuthenticationLive = Layer.effect(
    Authentication,
    Effect.gen(function*() {
        const jwtSecret = yield* Config.string("JWT_SECRET")
        const redisService = yield* RedisService
        return Authentication.of({
            cookie: (token) =>
                Effect.gen(function*() {
                    const accessToken = Redacted.value(token)
                    if (!accessToken) {
                        return yield* Effect.fail(new Unauthorized())
                    }
                    const { username, id } = yield* Effect.try({
                        try: () => jsonwebtoken.verify(accessToken, jwtSecret) as JwtPayload,
                        catch: () => new Unauthorized(),
                    })
                    let tokenRedis = yield* Effect.tryPromise({
                        try: () => redisService.get(username),
                        catch: (err) => { console.log(`Redis error ${err}`); throw ({ error: "Issue talking to redis", type: "INTERNAL" } as InternalError) }
                    })
                    if (!tokenRedis || tokenRedis.length == 0 || tokenRedis != accessToken) {
                        throw new Unauthorized()
                    }
                    return { username, id }
                }),
        })
    })
).pipe(Layer.provide(RedisServiceLive))

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
                            ),
                        ),
                    )
                )
                .handle("me", () => {
                    return Effect.gen(function*() {
                        const currentUser = yield* CurrentUser
                        return currentUser
                    })
                })
        })
).pipe(
    Layer.provide(UserserviceLive),
    Layer.provide(PrismaServiceLive),
    Layer.provide(RedisServiceLive),
    Layer.provide(AuthenticationLive),
)
