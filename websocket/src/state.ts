export type PodData = {
    podId: string // maybe a uuid
    replId: number
}

export class ConnectionState {
    private static instance: ConnectionState

    static socketIdToPodData: Map<string, PodData>

    private constructor() {
        ConnectionState.socketIdToPodData = new Map()
    }

    static getInstance() {
        if (!ConnectionState.instance) {
            ConnectionState.instance = new ConnectionState()
        }
        return ConnectionState.instance
    }

    getSocketToPodData() {
        return ConnectionState.socketIdToPodData
    }

    insertNewSocketPodInfo(socketId: string, podData: PodData): boolean {
        if (ConnectionState.socketIdToPodData.size != 0) {
            return false
        }
        ConnectionState.socketIdToPodData.set(socketId, podData)
        return true
    }

    removeSocket(socketId: string): number | undefined {
        let socketData = ConnectionState.socketIdToPodData.get(socketId)?.replId
        ConnectionState.socketIdToPodData.delete(socketId)
        return socketData
    }

    auth(socketId: string): boolean {
        let socketData = ConnectionState.socketIdToPodData.get(socketId)
        if (!socketData) {
            return false
        }
        return true
    }
}
