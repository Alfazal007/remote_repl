import { PrismaService } from "app/common/PrismaService"
import { Config, Context, Effect, Layer } from "effect"
import type { GeneralError, InternalError, NotFoundError } from "app/common/CommonError"
import bcrypt from "bcrypt"
import jsonwebtoken from "jsonwebtoken"
import { CreateUserResponseSchema, CreateUserResponseSchemaType, SignInResponseSchema, SignInResponseSchemaType } from "./Schema.js"
import { RedisService } from "app/common/RedisService"

interface UserserviceInterface {
    createUser: (username: string, password: string) =>
        Effect.Effect<CreateUserResponseSchemaType, InternalError | GeneralError>,
    signin: (username: string, password: string) =>
        Effect.Effect<SignInResponseSchemaType, InternalError | NotFoundError | GeneralError>
}

export class UserService extends Context.Tag(
    "http-server/Users/Service/UserService"
)<UserService, UserserviceInterface>() { }

export const UserserviceLive = Layer.effect(UserService,
    Effect.gen(function*() {
        const prismaClient = yield* PrismaService
        const redis = yield* RedisService

        const jwtSecret = yield* Config.string("JWT_SECRET")
        return {
            createUser(username, password) {
                return Effect.gen(
                    function*() {
                        const userExistsInDb = yield* Effect.tryPromise({
                            try: () => prismaClient.user.findFirst({ where: { username } }),
                            catch: (databaseErr) => {
                                console.log("Issue checking uniqueness of username", { databaseErr: String(databaseErr) })
                                return ({ error: "Issue talking to the database", type: "INTERNAL" } as InternalError)
                            }
                        })
                        if (userExistsInDb) {
                            return yield* Effect.fail({ error: "Use a different username as this one is already taken", type: "GENERAL" } as GeneralError)
                        }
                        const hashedPassword = yield* Effect.tryPromise({
                            try: () => bcrypt.hash(password, 12),
                            catch: (err) => {
                                console.log({ err: String(err) })
                                return ({ error: `Issue hashing the password, ${password}`, type: "GENERAL" } as GeneralError)
                            }
                        })
                        const newUser = yield* Effect.tryPromise({
                            try: () => prismaClient.user.create({ data: { username, password: hashedPassword } }),
                            catch: (databaseErr) => {
                                console.log("Issue creating the new user ", { databaseErr })
                                return ({ error: "Issue talking to the database", type: "INTERNAL" } as InternalError)
                            }
                        })
                        return { id: newUser.id, username: newUser.username } as typeof CreateUserResponseSchema.Type
                    }
                );
            },
            signin(username, password) {
                return Effect.gen(function*() {
                    const userFromDb = yield* Effect.tryPromise({
                        try: () => prismaClient.user.findFirst({ where: { username } }),
                        catch: (databaseErr) => {
                            console.log("Issue checking uniqueness of username", { databaseErr: String(databaseErr) })
                            return ({ error: "Issue talking to the database", type: "INTERNAL" } as InternalError)
                        }
                    })
                    if (!userFromDb) {
                        return yield* Effect.fail({ error: "User not found in the database", type: "NOTFOUND" } as NotFoundError)
                    }
                    const passwordMatchResult = yield* Effect.tryPromise({
                        try: () => bcrypt.compare(password, userFromDb.password),
                        catch: (err) => { console.log(`Hash comparison error ${err}`); return ({ error: `Issue comparing hash`, type: `GENERAL` } as GeneralError) }
                    })
                    if (!passwordMatchResult) {
                        return yield* Effect.fail({ error: `Incorrect password`, type: `GENERAL` } as GeneralError)
                    }
                    const accessToken = jsonwebtoken.sign({
                        username,
                        id: userFromDb.id
                    }, jwtSecret, { expiresIn: "24h" })
                    yield* Effect.tryPromise({
                        try: () => redis.set(username, accessToken),
                        catch: (err) => { console.log(`Redis error ${err}`); return ({ error: "Issue talking to redis", type: "INTERNAL" } as InternalError) }
                    })
                    return { username: userFromDb.username, accessToken, id: userFromDb.id } as typeof SignInResponseSchema.Type
                })
            },
        }
    })
)
