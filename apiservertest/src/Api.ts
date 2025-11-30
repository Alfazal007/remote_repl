import { HttpApi } from "@effect/platform"
import { TestsApi } from "./Tests/Api.js"

export class Api extends HttpApi.make("api")
    .add(TestsApi)
{ }
