import { HttpApiSchema } from "@effect/platform";
import { Context, Schema } from "effect";
import { CreateUserResponseSchemaType } from "./Schema.js";

export const UserId = Schema.Number.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export class CurrentUser extends Context.Tag("Domain/User/CurrentUser")<
    CurrentUser,
    CreateUserResponseSchemaType
>() { }

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
    "UserNotFound",
    { id: UserId },
    HttpApiSchema.annotations({ status: 404 })
) { }

