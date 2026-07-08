import { spawn } from 'child_process'
import net from 'net'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const node = process.execPath
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js')
const apiPort = Number(process.env.PORT || 5000)

const processes = []
let shuttingDown = false

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
    socket.setTimeout(500, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function run(name, command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
  })

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`))
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`))
  child.on('exit', (code) => {
    if (code !== 0 && !shuttingDown) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code || 1)
    }
  })

  processes.push(child)
  return child
}

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  for (const child of processes) {
    if (!child.killed) child.kill()
  }
  setTimeout(() => process.exit(code), 100)
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

if (await isPortOpen(apiPort)) {
  console.log(`[api] http://127.0.0.1:${apiPort} is already running`)
} else {
  run('api', node, ['server.js'], { PORT: String(apiPort) })
}

run('vite', node, [viteBin, '--host', '127.0.0.1', '--port', '5173'])