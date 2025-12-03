import { Context, Effect, Layer } from "effect";
import { createClient } from "redis";

export class RedisService extends Context.Tag("http-server/common/RedisService")<
    RedisService,
    Awaited<ReturnType<typeof createClient>>
>() { }

export const RedisServiceLive = Layer.effect(
    RedisService,
    Effect.gen(function*() {
        const redisClient = createClient();
        if (!redisClient.isOpen) {
            yield* Effect.promise(() => redisClient.connect());
        }
        return redisClient;
    })
)
