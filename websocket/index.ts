import http from 'http'
import { Server } from 'socket.io'
import { ConnectionState } from './src/state'
import { randomUUID } from 'crypto'
import { tryCatchAsync } from './src/helpers/tryCatch'
import { prisma } from './src/common/prisma'
import { listFilesAndDirs } from './src/helpers/lsReader'
import { overwriteFile } from './src/helpers/writeToFile'
import { readFileText } from './src/helpers/readFromFile'
import axios from 'axios'

const validUserUrl = "http://localhost:3000/validUser"

const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        if (req.url === '/health') {
            res.writeHead(200).end()
        }
    }
})

const io = new Server(server, {
    cors: {
        origin: "*",
    }
})

// THIS IS MY SECOND CONTAINER ON THE POD THE ONE WITHOUT THE TERMINAL ACCESS TO THE USER 
// THE GOAL IS FOR THE USER TO TALK TO THIS SERVICE AND 
// ESTABLISH A WEBSOCKET COMMUNICATION PROTOCOL AND WHEN A USER DISCONNECTS THEN UPDATE 
// THE S3 AND ONLY AFTER THAT SEND A DISCONNECTION MESSAGE TO THE MAIN SERVER
// THIS WILL ALREADY HAVE THE S3 FILES
io.on('connection', (socket) => {
    console.log('Client connected')

    // here the callback function runs the function with the boolean value true if successful connection and false otherwise
    socket.on('connect', async (accessToken: string, userId: number, replId: number, callback) => {
        const userValid = await axios.post(validUserUrl, {
            userId,
            accessToken,
            repoId: replId,
            sharedToken: "shanks"
        })
        if (userValid.status != 200) {
            callback(false)
            return
        }
        let res = ConnectionState.getInstance().insertNewSocketPodInfo(socket.id, {
            podId: randomUUID(),
            replId
        })
        callback(res)
    })

    socket.on("folders", async (path: string, callback) => {
        let isAuthenticated = ConnectionState.getInstance().auth(socket.id)
        if (!isAuthenticated) {
            return
        }
        const listRes = await tryCatchAsync(listFilesAndDirs(path))
        if (!listRes.error) {
            console.log({ listRes: listRes.data })
            callback(listRes, true)
            return
        }
        callback([], false)
    })

    socket.on("updateFile", async (path: string, data: string, callback) => {
        let isAuthenticated = ConnectionState.getInstance().auth(socket.id)
        if (!isAuthenticated) {
            return
        }
        let res = await tryCatchAsync(overwriteFile(path, data))
        if (res.error) {
            callback(false)
            return
        }
        callback(true)
    })

    socket.on("getFile", async (path: string, callback) => {
        let isAuthenticated = ConnectionState.getInstance().auth(socket.id)
        if (!isAuthenticated) {
            return
        }
        let res = await tryCatchAsync(readFileText(path))
        if (!res.error) {
            callback(res.data)
        }
    })

    socket.on("disconnect", async () => {
        let isAuthenticated = ConnectionState.getInstance().auth(socket.id)
        if (!isAuthenticated) {
            return
        }
        let replId = ConnectionState.getInstance().removeSocket(socket.id)
        if (replId) {
            await tryCatchAsync(prisma.repl.update({
                where: {
                    id: replId
                },
                data: {
                    hasStarted: false
                }
            }))
            process.exit(0)
        }
    })
})

server.listen(3001, () => {
    console.log('Server running on port 3001')
})
