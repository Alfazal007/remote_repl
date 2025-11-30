import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "../Api.js"

export const HttpTestLive = HttpApiBuilder.group(
    Api,
    "tests",
    (handlers) =>
        Effect.gen(function*() {
            return handlers
                .handle("echo", () =>
                    Effect.succeed(null)
                )
        })
)
