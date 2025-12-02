import { HttpApiEndpoint, HttpApiGroup, } from "@effect/platform"
import { Schema } from "effect";
import { CreateUserSchema } from "./Schema.js";
import { GeneralError, InternalError } from "app/common/CommonError";

export class UsersApi extends HttpApiGroup.make("apiServer/src/users/usersApi")
    .add(
        HttpApiEndpoint.post("createUser", "/create")
            .setPayload(CreateUserSchema)
            .addSuccess(Schema.Any, { status: 201 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
    )
{ }
