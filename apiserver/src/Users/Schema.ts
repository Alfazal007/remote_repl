import { Schema } from "effect";

export const CreateUserSchema = Schema.Struct({
    username: Schema.String.pipe(Schema.minLength(6), Schema.maxLength(20)),
    password: Schema.String.pipe(Schema.minLength(6), Schema.maxLength(20)),
})

export const CreateUserResponseSchema = Schema.Struct({
    id: Schema.Number,
    username: Schema.String
})

export const SignInResponseSchema = Schema.Struct({
    id: Schema.Number,
    username: Schema.String,
    accessToken: Schema.String
})

export type CreateUserResponseSchemaType = typeof CreateUserResponseSchema.Type
export type SignInResponseSchemaType = typeof SignInResponseSchema.Type

