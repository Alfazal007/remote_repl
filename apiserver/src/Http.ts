import { HttpApiBuilder, HttpMiddleware, HttpServer } from "@effect/platform"
import { NodeHttpServer } from "@effect/platform-node"
import { Layer } from "effect"
import { createServer } from "http"
import { Api } from "./Api.js"
import { HttpUsersLive } from "./Users/Http.js"
import { HttpReplLive } from "./Repl/Http.js"

const ApiLive = Layer.provide(HttpApiBuilder.api(Api), [
    HttpUsersLive,
    HttpReplLive,
])

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
    Layer.provide(HttpApiBuilder.middlewareCors()),
    Layer.provide(ApiLive),
    HttpServer.withLogAddress,
    Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)
