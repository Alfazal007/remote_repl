import { Schema } from "effect";

export const ErrorType = Schema.Enums({
    GENERAL: "GENERAL",
    INTERNAL: "INTERNAL",
});

export const InternalError = Schema.Struct({
    error: Schema.String,
    type: Schema.Literal("INTERNAL"),
    details: Schema.optional(Schema.String),
})

export const GeneralError = Schema.Struct({
    error: Schema.String,
    type: Schema.Literal("GENERAL"),
    details: Schema.optional(Schema.String),
})

export type InternalError = Schema.Schema.Type<typeof InternalError>;
export type GeneralError = Schema.Schema.Type<typeof GeneralError>;
