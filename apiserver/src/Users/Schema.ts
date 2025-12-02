import { Schema } from "effect";

export const CreateUserSchema = Schema.Struct({
    username: Schema.String.pipe(Schema.minLength(6), Schema.maxLength(20)),
    password: Schema.String.pipe(Schema.minLength(6), Schema.maxLength(20)),
})

export type CreateUserSchemaType = typeof CreateUserSchema 
