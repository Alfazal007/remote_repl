export type PodData = {
    podId: string // maybe a uuid
}

export class ConnectionState {
    static instance: ConnectionState

    static socketIdToPodData: Map<string, PodData>

    private constructor() {
        ConnectionState.socketIdToPodData = new Map()
    }

    getInstance() {
        if (!ConnectionState.instance) {
            ConnectionState.instance = new ConnectionState()
        }
        return ConnectionState.instance
    }

    getSocketToPodData() {
        return ConnectionState.socketIdToPodData
    }

    insertNewSocketPodInfo(socketId: string, podData: PodData) {
        ConnectionState.socketIdToPodData.set(socketId, podData)
    }

    removeSocket(socketId: string) {
        ConnectionState.socketIdToPodData.delete(socketId)
    }
}
