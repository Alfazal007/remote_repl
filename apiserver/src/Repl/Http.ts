import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Api } from "../Api.js"
import { PrismaServiceLive } from "app/common/PrismaService"
import { RedisServiceLive } from "app/common/RedisService"
import { AuthenticationLive } from "app/Users/Http"
import { ReplService, ReplserviceLive } from "./Service.js"
import { HelperServiceLive } from "app/common/HelperService"
import { S3ServiceLive } from "app/common/S3Client"

export const HttpReplLive = HttpApiBuilder.group(
    Api,
    "apiServer/src/repl/replApi",
    (handlers) =>
        Effect.gen(function*() {
            const replService = yield* ReplService
            return handlers
                .handle("create", ({ payload }) =>
                    replService.createRepl(payload.type as "NODE" | "RUST")
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
