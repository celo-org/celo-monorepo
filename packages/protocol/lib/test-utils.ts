import chai from 'chai';
import chaiSubset from 'chai-subset';
// eslint-disable-next-line: ordered-imports
import { spawn } from 'child_process';

/* eslint:disabled ordered-imports: 0 */

chai.use(chaiSubset)

// hard coded in ganache
export const EPOCH = 100



export const assertThrowsAsync = async (promise: any, errorMessage: string = '') => {
  let failed = false
  try {
    await promise
  } catch (_) {
    failed = true
  }

  assert.strictEqual(true, failed, errorMessage)
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



