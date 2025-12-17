import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { GeneralError, InternalError, NotFoundError } from "app/common/CommonError";
import { Unauthorized } from "@effect/platform/HttpApiError";
import { Authentication } from "app/Users/Api";
import { CreateReplResponseSchema, CreateReplSchema } from "./Schema.js";
import { Schema } from "effect";

export class ReplApi extends HttpApiGroup.make("apiServer/src/repl/replApi")
    .add(
        HttpApiEndpoint.post("create", "/repl/create")
            .setPayload(CreateReplSchema)
            .addSuccess(CreateReplResponseSchema, { status: 201 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
            .addError(Unauthorized, { status: 401 })
            .addError(NotFoundError, { status: 404 })
            .middleware(Authentication)
    )
    .add(
        HttpApiEndpoint.post("startRepl", "/repl/start")
            .setPayload(CreateReplResponseSchema)
            .addSuccess(Schema.Void, { status: 200 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
            .addError(Unauthorized, { status: 401 })
            .addError(NotFoundError, { status: 404 })
            .middleware(Authentication)
    )
    .add(
        HttpApiEndpoint.del("deleteRepl", "/repl/delete")
            .setPayload(CreateReplResponseSchema)
            .addSuccess(Schema.Void, { status: 200 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
            .addError(Unauthorized, { status: 401 })
            .addError(NotFoundError, { status: 404 })
            .middleware(Authentication)
    )
{ }
