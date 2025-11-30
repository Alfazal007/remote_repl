import { HttpApiEndpoint, HttpApiGroup, } from "@effect/platform"
import { Schema } from "effect"

export class TestsApi extends HttpApiGroup.make("tests")
    .add(
        HttpApiEndpoint.post("echo", "/echo")
            .addSuccess(Schema.Null)
            .setPayload(Schema.Null)
    )
{ }
