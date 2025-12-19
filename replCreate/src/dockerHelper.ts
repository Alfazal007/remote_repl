import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface BuildResult {
    success: boolean;
    message?: string;
    error?: string;
}

async function pullS3DataLocally(
    awsRegion: string,
    s3BucketPath: string,
    awsAccessKeyId: string,
    awsEndpoint: string,
    awsSecretAccessKey: string
): Promise<void> {
    const parts = s3BucketPath.split("/");
    const bucket = parts[0];
    const prefix = parts.slice(1).join("/") || undefined;

    const client = new S3Client({
        region: awsRegion,
        endpoint: awsEndpoint,
        credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
        },
    });

    const dataDir = "./s3-data";
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    let continuationToken: string | undefined;
    let totalObjects = 0;

    do {
        const listCommand = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        });

        const listResponse = await client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            break;
        }

        for (const object of listResponse.Contents) {
            if (!object.Key) continue;

            totalObjects++;

            const getCommand = new GetObjectCommand({
                Bucket: bucket,
                Key: object.Key,
            });

            const getResponse = await client.send(getCommand);

            if (!getResponse.Body) {
                continue;
            }

            const readableStream = sdkStreamMixin(getResponse.Body);

            const relativePath = prefix
                ? object.Key.replace(`${prefix}/`, "")
                : object.Key;

            const fileDir = path.join(dataDir, path.dirname(relativePath));
            fs.mkdirSync(fileDir, { recursive: true });

            const filePath = path.join(dataDir, relativePath);
            const writeStream = fs.createWriteStream(filePath);

            await new Promise<void>((resolve, reject) => {
                readableStream.pipe(writeStream);
                writeStream.on("finish", resolve);
                writeStream.on("error", reject);
                readableStream.on("error", reject);
            });
        }

        continuationToken = listResponse.NextContinuationToken;
    } while (continuationToken);
}

function generateS3ImageDockerfile(): string {
    const dockerfileContent = `FROM alfazal/repl-socket-base:latest

COPY ./s3-data /app/src/data

WORKDIR /app

CMD ["bun", "index.ts"]
`;

    return dockerfileContent;
}

async function buildS3ImageLocallyAndPush(
    awsRegion: string,
    s3BucketPath: string,
    imageName: string,
    imageTag: string,
    awsAccessKeyId: string,
    awsEndpoint: string,
    awsSecretAccessKey: string,
    pushToDockerHub: boolean
): Promise<BuildResult> {
    try {
        console.log(`Pulling S3 data from s3://${s3BucketPath}...`);
        await pullS3DataLocally(
            awsRegion,
            s3BucketPath,
            awsAccessKeyId,
            awsEndpoint,
            awsSecretAccessKey
        );

        const dockerfileContent = generateS3ImageDockerfile();

        fs.writeFileSync("Dockerfile", dockerfileContent);

        const sanitizedImageName = imageName.replace(/\//g, "-");
        const fullImageName = `alfazal/${sanitizedImageName}:${imageTag}`;
        console.log(`Building image ${fullImageName}...`);
        execSync(`docker build -t ${fullImageName} .`, {
            stdio: "inherit",
        });

        if (pushToDockerHub) {
            console.log(`Pushing ${fullImageName} to Docker Hub...`);
            execSync(`docker push ${fullImageName}`, {
                stdio: "inherit",
            });
        }

        return {
            success: true,
            message: `Successfully built ${fullImageName} with S3 data`,
        };
    } catch (error) {
        return {
            success: false,
            error: `Build failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    } finally {
        if (fs.existsSync("Dockerfile")) {
            fs.unlinkSync("Dockerfile");
        }
        if (fs.existsSync("./s3-data")) {
            fs.rmSync("./s3-data", { recursive: true, force: true });
        }
        const sanitizedImageName = imageName.replace(/\//g, "-");
        const fullImageName = `alfazal/${sanitizedImageName}:${imageTag}`;
        try {
            execSync(`docker rmi ${fullImageName}`, { stdio: "pipe" });
        } catch { }
    }
}

export { buildS3ImageLocallyAndPush };
