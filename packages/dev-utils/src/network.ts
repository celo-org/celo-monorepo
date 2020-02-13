import { spawn, SpawnOptions } from 'child_process'
import sleep from 'sleep-promise'

export async function waitForPortOpen(host: string, port: number, seconds: number) {
  const deadline = Date.now() + seconds * 1000
  do {
    console.log('waitForPortOpen')
    if (await isPortOpen(host, port)) {
      return true
    }
  } while (Date.now() < deadline)
  return false
}

async function isPortOpen(host: string, port: number) {
  console.log('is port open?')
  if (true) {
    await sleep(5000)
    return true
  }
  return (await execCmd('nc', ['-z', host, port.toString()], { silent: false })) === 0
}

function execCmd(cmd: string, args: string[], options?: SpawnOptions & { silent?: boolean }) {
  return new Promise<number>(async (resolve, reject) => {
    const { silent, ...spawnOptions } = options || { silent: false }
    if (!silent) {
      console.debug('$ ' + [cmd].concat(args).join(' '))
    }
    // console.log('is port open?')
    const process = spawn(cmd, args, { ...spawnOptions, stdio: silent ? 'ignore' : 'inherit' })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
    process.on('message', console.info)
    process.on('error', console.info)
    // process.on('close', console.info)
  })
}
