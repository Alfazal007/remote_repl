import { Context, Effect, Layer } from "effect";
import { InternalError } from "./CommonError.js";
import { S3Service, S3ServiceLive } from "./S3Client.js";
import {
    CopyObjectCommand,
    DeleteObjectsCommand,
    ListObjectsV2Command,
    ListObjectVersionsCommand,
} from "@aws-sdk/client-s3";

interface HelperServiceFns {
    copyWithinS3: (
        destination: string,
        type: "NODE" | "RUST"
    ) => Effect.Effect<void, InternalError>;
    deleteFromS3: (folderPath: string) => Effect.Effect<void, InternalError>;
}

export class HelperService extends Context.Tag(
    "http-server/common/HelperService"
)<HelperService, HelperServiceFns>() { }

export const HelperServiceLive = Layer.effect(
    HelperService,
    Effect.gen(function*() {
        const s3Client = yield* S3Service;

        return {
            copyWithinS3(destination, type) {
                return Effect.gen(function*() {
                    const sourcePrefix = `template/${type.toLowerCase()}/`;
                    const destinationPrefix = `implementation/${destination}/`;
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
                                    error: "Issue with s3 listobjects command",
                                } as InternalError;
                            },
                        });
                        if (
                            !listResponse.Contents ||
                            listResponse.Contents.length === 0
                        ) {
                            return;
                        }
                        for (const object of listResponse.Contents) {
                            if (object.Key) {
                                const relativePath = object.Key.slice(
                                    sourcePrefix.length
                                );
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
                                            error: "Issue with s3 copy command",
                                        } as InternalError;
                                    },
                                });
                                objectsCopied++;
                            }
                        }
                        continuationToken = listResponse.NextContinuationToken;
                    } while (continuationToken);
                });
            },

            deleteFromS3(folderPath) {
                return Effect.gen(function*() {
                    const bucketName = process.env.BUCKET_NAME as string;
                    let versionKeyMarker: string | undefined = undefined;
                    let versionIdMarker: string | undefined = undefined;
                    let successCount = 0;
                    let failedCount = 0;

                    do {
                        const listVersionsResponse = yield* Effect.tryPromise({
                            try: () =>
                                s3Client.send(
                                    new ListObjectVersionsCommand({
                                        Bucket: bucketName,
                                        Prefix: folderPath,
                                        KeyMarker: versionKeyMarker,
                                        VersionIdMarker: versionIdMarker,
                                    })
                                ),
                            catch: (err) => {
                                console.log(`S3 error ${err}`);
                                return {
                                    type: "INTERNAL",
                                    error: "Issue with s3 list versions command",
                                } as InternalError;
                            },
                        });

                        const objectsToDelete = [
                            ...(listVersionsResponse.Versions?.map((v) => ({
                                Key: v.Key!,
                                VersionId: v.VersionId!,
                            })) || []),
                            ...(listVersionsResponse.DeleteMarkers?.map((m) => ({
                                Key: m.Key!,
                                VersionId: m.VersionId!,
                            })) || []),
                        ];

                        if (objectsToDelete.length > 0) {
                            const deleteResponse = yield* Effect.tryPromise({
                                try: () =>
                                    s3Client.send(
                                        new DeleteObjectsCommand({
                                            Bucket: bucketName,
                                            Delete: {
                                                Objects: objectsToDelete,
                                                Quiet: false,
                                            },
                                        })
                                    ),
                                catch: (err) => {
                                    console.log(`S3 error ${err}`);
                                    return {
                                        type: "INTERNAL",
                                        error: "Issue with s3 delete command",
                                    } as InternalError;
                                },
                            });

                            successCount += deleteResponse.Deleted?.length || 0;
                            failedCount += deleteResponse.Errors?.length || 0;

                            if (
                                deleteResponse.Errors &&
                                deleteResponse.Errors.length > 0
                            ) {
                                console.error(
                                    "Failed to delete some objects:",
                                    deleteResponse.Errors
                                );
                            }
                        }

                        versionKeyMarker = listVersionsResponse.IsTruncated
                            ? listVersionsResponse.NextKeyMarker
                            : undefined;
                        versionIdMarker = listVersionsResponse.IsTruncated
                            ? listVersionsResponse.NextVersionIdMarker
                            : undefined;
                    } while (versionKeyMarker);
                });
            },
        };
    })
).pipe(Layer.provide(S3ServiceLive));
