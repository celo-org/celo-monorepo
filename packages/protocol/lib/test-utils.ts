import chai from 'chai';
import chaiSubset from 'chai-subset';
// eslint-disable-next-line: ordered-imports
import { spawn, SpawnOptions } from 'child_process';

/* eslint:disabled ordered-imports: 0 */

chai.use(chaiSubset)

// hard coded in ganache
export const EPOCH = 100


async function isPortOpen(host: string, port: number) {
  return (await execCmd('nc', ['-z', host, port.toString()], { silent: true })) === 0
}


function execCmd(cmd: string, args: string[], options?: SpawnOptions & { silent?: boolean }) {
  return new Promise<number>(async (resolve, reject) => {
    const { silent, ...spawnOptions } = options || { silent: false }
    if (!silent) {
      console.debug('$ ' + [cmd].concat(args).join(' '))
    }
    const process = spawn(cmd, args, { ...spawnOptions, stdio: silent ? 'ignore' : 'inherit' })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export const assertThrowsAsync = async (promise: any, errorMessage: string = '') => {
  let failed = false
  try {
    await promise
  } catch (_) {
    failed = true
  }

  assert.strictEqual(true, failed, errorMessage)
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}


export async function waitForPortOpen(host: string, port: number, seconds: number) {
  console.info(`Waiting for ${host}:${port} to open for ${seconds}s`);
  const deadline = Date.now() + seconds * 1000
  do {
    if (await isPortOpen(host, port)) {
      await delay(60000) // extra 60s just to give ganache extra time to startup
      console.info(`Port ${host}:${port} opened`)
      return true
    }
  } while (Date.now() < deadline)
  console.info("Port was not opened in time");
  return false
}



export async function exec(command: string, args: string[]) {
  console.info(`Running: ${command} ${args}`)
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: [process.stdout, process.stderr],
    })
    const dataGlobal = [];

    proc.on('error', (error: any) => {
      reject(error)
    })

    proc.stderr.on('data', (data: any) => {
      dataGlobal.push(data.toString())
    })

    proc.on('exit', (code: any) => {
      if (code !== 0) {
        reject({code, stout: dataGlobal.join(" ")})
      } else {
        resolve()
      }
    })
  })
}



