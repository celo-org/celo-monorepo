import { spawn } from 'child_process'
import * as fs from 'fs'

export async function setProject(PROJECT_NAME: string) {
  await exec('yarn', ['run', 'firebase', 'use', PROJECT_NAME])
}

export function setEnv(CELO_ENV: string) {
  fs.writeFile(__dirname + '/../src/celoEnv.ts', `export const CELO_ENV = '${CELO_ENV}'`, (err) => {
    if (err) {
      console.info('Error saving celoEnv.ts file!')
      throw err
    }
    console.info('celoEnv.ts file has been saved!')
  })
}

export async function deploy(CELO_ENV: string) {
  await exec('yarn', ['run', 'build', CELO_ENV])
  await exec('yarn', [
    'run',
    'firebase',
    'deploy',
    '--only',
    `database,hosting,functions:handleVerificationRequest${CELO_ENV}`,
  ])
}

export async function setConfig(
  CELO_ENV: string,
  testnetId: string,
  txIP: string,
  txPort: string,
  appSignature: string
) {
  await exec('yarn', [
    'run',
    'firebase',
    'functions:config:set',
    `${CELO_ENV}.testnet-id=${testnetId}`,
    `${CELO_ENV}.tx-ip=${txIP}`,
    `${CELO_ENV}.tx-port=${txPort}`,
    `${CELO_ENV}.app-signature=${appSignature}`,
  ])

  await exec('yarn', ['run', 'firebase', 'deploy', '--only', `functions:configDummy`])
}

export async function deleteDeployment(CELO_ENV: string) {
  if (CELO_ENV.includes('production')) {
    throw new Error('No automated deletion allowed of production instances.')
  }

  await exec('yarn', ['run', 'firebase', 'functions:config:unset', CELO_ENV])
  await exec('yarn', ['run', 'firebase', 'deploy', '--only', `functions:configDummy`])
  await exec('yarn', [
    'run',
    'firebase',
    'functions:delete',
    `handleVerificationRequest${CELO_ENV}`,
    '--force',
  ])

  // TODO - Implement automated deltion of Verification Pool Databse Tables
  console.info(
    `Automated deletion of Verification Pool Database Tables not currently supported, delete manually.
     Visit https://console.firebase.google.com/u/0/project/celo-testnet/database/celo-testnet/data to do so.`
  )
}

// TODO - Merge with tooling in Celotool and in Protocol
// This function was based on one found in /protocol/lib/test-utils.ts
async function exec(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: [process.stdout, process.stderr],
      cwd: __dirname,
    })
    proc.on('error', (error: any) => {
      reject(error)
    })
    proc.on('exit', (code: any) => {
      if (code !== 0) {
        reject(code)
      } else {
        resolve()
      }
    })
  })
}
