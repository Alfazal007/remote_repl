import { spawn } from 'node-pty'
import type { IPty } from 'node-pty'

const SHELL = "bash"

export class TerminalManager {
    private sessions: {
        [id: string]: { terminal: IPty; replId: number }
    } = {}

    constructor() {
        this.sessions = {}
    }

    createPty(
        id: string,// socketid
        replId: number,
        onData: (data: string, pid: number) => void
    ) {
        const term = spawn(SHELL, [], {
            cols: 100,
            name: 'xterm',
            cwd: './data'
        })
        term.onData((data: string) => {
            onData(data, term.pid)
        })
        this.sessions[id] = {
            terminal: term,
            replId
        }
        term.onExit(() => {
            delete this.sessions[id]
        })
        return term
    }

    write(terminalId: string, data: string) {
        this.sessions[terminalId]?.terminal.write(data)
    }

    clear(terminalId: string) {
        this.sessions[terminalId]?.terminal.kill()
        delete this.sessions[terminalId]
    }
}
