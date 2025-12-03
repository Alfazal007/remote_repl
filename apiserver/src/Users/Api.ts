import { HttpApiEndpoint, HttpApiGroup, HttpApiMiddleware, HttpApiSecurity, } from "@effect/platform"
import { CreateUserResponseSchema, CreateUserSchema, SignInResponseSchema } from "./Schema.js";
import { GeneralError, InternalError, NotFoundError } from "app/common/CommonError";
import { CurrentUser } from "./User.js";
import { Unauthorized } from "@effect/platform/HttpApiError";
export class Authentication extends HttpApiMiddleware.Tag<Authentication>()(
    "Accounts/Api/Authentication",
    {
        provides: CurrentUser,
        failure: Unauthorized,
        security: {
            cookie: HttpApiSecurity.apiKey({
                in: "cookie",
                key: "token"
            }),
        }
    }
) { }

export class UsersApi extends HttpApiGroup.make("apiServer/src/users/usersApi")
    .add(
        HttpApiEndpoint.get("me", "/me")
            .addSuccess(CreateUserResponseSchema, { status: 200 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
            .addError(Unauthorized, { status: 401 })
            .addError(NotFoundError, { status: 404 })
            .middleware(Authentication)
    )
    .add(
        HttpApiEndpoint.post("createUser", "/create")
            .setPayload(CreateUserSchema)
            .addSuccess(CreateUserResponseSchema, { status: 201 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
    )
    .add(
        HttpApiEndpoint.post("signin", "/signin")
            .setPayload(CreateUserSchema)
            .addSuccess(SignInResponseSchema, { status: 200 })
            .addError(GeneralError, { status: 400 })
            .addError(InternalError, { status: 500 })
            .addError(NotFoundError, { status: 404 })
    )
{ }
