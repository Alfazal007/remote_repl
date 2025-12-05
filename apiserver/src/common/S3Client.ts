import { S3Client } from "@aws-sdk/client-s3";
import { Context, Effect, Layer } from "effect";

export class S3Service extends Context.Tag("http-server/common/S3Client")<
    S3Service,
    S3Client
>() { }

export const S3ServiceLive = Layer.effect(
    S3Service,
    Effect.gen(function*() {
        const s3Client = new S3Client({
            endpoint: process.env.ENDPOINT as string,
            region: process.env.REGION as string,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
            },
        });
        return s3Client;
    })
)
