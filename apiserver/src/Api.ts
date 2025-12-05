import { HttpApi } from "@effect/platform"
import { UsersApi } from "./Users/Api.js"
import { ReplApi } from "./Repl/Api.js"

export class Api extends HttpApi.make("api")
    .add(UsersApi)
    .add(ReplApi)
{ }
