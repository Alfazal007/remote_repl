import { Context, Effect, Layer } from "effect";
import { InternalError } from "./CommonError.js";
import { S3Service } from "./S3Client.js";
import { CopyObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

interface HelperServiceFns {
    copyWithinS3: (destination: string, type: "NODE" | "RUST") => Effect.Effect<void, InternalError, S3Service>
}

export class HelperService extends Context.Tag("http-server/common/HelperService")<HelperService, HelperServiceFns>() { }

export const HelperServiceLive = Layer.sync(
    HelperService,
    () => ({
        copyWithinS3: (destination: string, type: "NODE" | "RUST") =>
            Effect.gen(function*() {
                const sourcePrefix = `template/${type.toLowerCase()}/`;
                const destinationPrefix = `implementation/${destination}/`;
                const s3Client = yield* S3Service;
                let continuationToken: string | undefined;
                const bucketName = process.env.BUCKET_NAME as string;
                let objectsCopied = 0;
                do {
                    const listCommand = new ListObjectsV2Command({
                        Bucket: bucketName,
                        Prefix: sourcePrefix,
                        ContinuationToken: continuationToken,
                    });
                    const listResponse = yield* Effect.tryPromise({
                        try: () => s3Client.send(listCommand),
                        catch: (err) => {
                            console.log(`S3 error ${err}`);
                            return {
                                type: "INTERNAL",
                                error: "Issue with s3 listobjects command"
                            } as InternalError;
                        }
                    });
                    if (!listResponse.Contents || listResponse.Contents.length === 0) {
                        return;
                    }
                    for (const object of listResponse.Contents) {
                        if (object.Key) {
                            const relativePath = object.Key.slice(sourcePrefix.length);
                            const destinationKey = `${destinationPrefix}${relativePath}`;
                            const copyCommand = new CopyObjectCommand({
                                Bucket: bucketName,
                                CopySource: `${bucketName}/${object.Key}`,
                                Key: destinationKey,
                            });
                            yield* Effect.tryPromise({
                                try: () => s3Client.send(copyCommand),
                                catch: (err) => {
                                    console.log(`S3 error ${err}`);
                                    return {
                                        type: "INTERNAL",
                                        error: "Issue with s3 copy command"
                                    } as InternalError;
                                }
                            });
                            objectsCopied++;
                        }
                    }
                    continuationToken = listResponse.NextContinuationToken;
                } while (continuationToken);
            })
    })
)
