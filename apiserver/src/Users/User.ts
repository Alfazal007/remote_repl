import { HttpApiSchema } from "@effect/platform";
import { User } from "app/generated/prisma/client";
import { Context, Schema } from "effect";

export const UserId = Schema.Number.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export class CurrentUser extends Context.Tag("Domain/User/CurrentUser")<
    CurrentUser,
    User
>() { }

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
    "UserNotFound",
    { id: UserId },
    HttpApiSchema.annotations({ status: 404 })
) { }

