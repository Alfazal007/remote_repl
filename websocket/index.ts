import http from 'http'
import { Server } from 'socket.io'
import { ConnectionState } from './state'
import { randomUUID } from 'crypto'

const server = http.createServer()

const io = new Server(server, {
    cors: {
        origin: "*",
    }
})

io.on('connection', (socket) => {
    console.log('Client connected')
    socket.on('connect', async (accessToken: string, userId: number, repoId: number, callback) => {
        // TODO:: initialize prisma
        // TODO:: do the authentication
        // TODO:: prepare the docker command
        // TODO:: communicate with kubernetes
        // TODO:: copy over the repo
        // TODO:: prepare the pod
        // TODO:: get link
        // TODO:: send link to the user
        // TODO:: update the
        ConnectionState.instance.insertNewSocketPodInfo(socket.id, {
            podId: randomUUID()
        })

        callback(true)
    })

    socket.on("disconnect", () => {
        // TODO:: release resources
        ConnectionState.instance.removeSocket(socket.id)
    })
})

server.listen(3000, () => {
    console.log('Server running on port 3000')
})
