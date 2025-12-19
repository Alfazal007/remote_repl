import { configDotenv } from "dotenv";
import { buildS3ImageLocallyAndPush } from "./src/dockerHelper";
import { redis } from "./src/redis"

configDotenv()

const bucketName = process.env.BUCKET_NAME as string
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID as string
const awsAccessSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY as string
const awsRegion = process.env.REGION as string
const awsEndpoint = process.env.ENDPOINT as string

async function main() {
    while (true) {
        if (!redis.isOpen) {
            await redis.connect()
        }
        const data = await redis.brPop(['NODE', 'RUST'], 0);
        if (!data) {
            continue
        }
        let key = data.key as "NODE" | "RUST"
        let { repoId, userId }: { repoId: number, userId: number } = JSON.parse(data.element)
        const pathInS3 = `implementation/${userId}/${repoId}`
        let res = await buildS3ImageLocallyAndPush(awsRegion, `${bucketName}/${pathInS3}`, pathInS3, `latest`, awsAccessKeyId, awsEndpoint, awsAccessSecretAccessKey, true)
        console.log({ res })
        // update kubernetes thing
        // create k8s resources
        // pull data into a new container inside k8s
        // update the database state
        // insert data to the orchestrator to keep polling
    }
}

main()
