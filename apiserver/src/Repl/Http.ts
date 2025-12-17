import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Api } from "../Api.js"
import { PrismaServiceLive } from "app/common/PrismaService"
import { RedisServiceLive } from "app/common/RedisService"
import { AuthenticationLive } from "app/Users/Http"
import { ReplService, ReplserviceLive } from "./Service.js"
import { HelperServiceLive } from "app/common/HelperService"
import { S3ServiceLive } from "app/common/S3Client"
import { CurrentUser } from "app/Users/User"

export const HttpReplLive = HttpApiBuilder.group(
    Api,
    "apiServer/src/repl/replApi",
    (handlers) =>
        Effect.gen(function*() {
            const replService = yield* ReplService

            return handlers
                .handle("create", ({ payload }) =>
                    Effect.gen(function*() {
                        const currentUser = yield* CurrentUser
                        return yield* replService.createRepl(payload.type as "NODE" | "RUST", currentUser.id)
                    })
                )
                .handle("startRepl", ({ payload }) =>
                    Effect.gen(function*() {
                        const currentUser = yield* CurrentUser
                        return yield* replService.startRepl(payload.replId, currentUser.id)
                    })
                )
                .handle("deleteRepl", ({ payload }) =>
                    Effect.gen(function*() {
                        const currentUser = yield* CurrentUser
                        return yield* replService.deleteRepl(payload.replId, currentUser.id)
                    })
                )
        })
).pipe(
    Layer.provide(AuthenticationLive),
    Layer.provide(ReplserviceLive),
    Layer.provide(PrismaServiceLive),
    Layer.provide(RedisServiceLive),
    Layer.provide(S3ServiceLive),
    Layer.provide(HelperServiceLive),
)
