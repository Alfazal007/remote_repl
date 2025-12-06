import { Schema } from "effect";

export const ReplType = Schema.Enums({
    NODE: "NODE",
    RUST: "RUST",
})

export const CreateReplSchema = Schema.Struct({
    type: ReplType,
})

export const StartReplSchema = Schema.Struct({
    replId: Schema.Number,
})

export const CreateReplResponseSchema = Schema.Struct({
    replId: Schema.Number
})

export type CreateReplResponseSchemaType = typeof CreateReplResponseSchema.Type
