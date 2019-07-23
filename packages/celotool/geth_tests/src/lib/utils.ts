import {
  AccountType,
  ConsensusType,
  generateGenesis,
  generatePrivateKey,
  generatePublicKeyFromPrivateKey,
  getValidators,
} from '@celo/celotool/src/lib/generate_utils'
import { getEnodeAddress } from '@celo/celotool/src/lib/geth'
import { ensure0x } from '@celo/celotool/src/lib/utils'
import { assert } from 'chai'
import { spawn, SpawnOptions } from 'child_process'
import fs from 'fs'
import { join as joinPath, resolve as resolvePath } from 'path'
import { Admin } from 'web3-eth-admin'

interface GethInstanceConfig {
  name: string
  validating: boolean
  syncmode: string
  port: number
  rpcport: number
  lightserv?: boolean
  privateKey?: string
  etherbase?: string
  peers?: string[]
}

interface GethTestConfig {
  migrate?: boolean
  migrateTo?: number
  instances: GethInstanceConfig[]
}

const TEST_DIR = '/tmp/e2e'
const GENESIS_PATH = `${TEST_DIR}/genesis.json`
const networkid = 1101

export function spawnWithLog(cmd: string, args: string[], logsFilepath: string) {
  try {
    fs.unlinkSync(logsFilepath)
  } catch (error) {
    // nothing to do
  }
  const logStream = fs.createWriteStream(logsFilepath, { flags: 'a' })
  const process = spawn(cmd, args)
  process.stdout.pipe(logStream)
  process.stderr.pipe(logStream)
  return process
}

export function execCmd(cmd: string, args: string[], options?: SpawnOptions) {
  return new Promise<number>(async (resolve, reject) => {
    console.debug('$ ' + [cmd].concat(args).join(' '))
    const process = spawn(cmd, args, { ...options, stdio: 'inherit' })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
  })
}

// Returns a Promise which resolves to [stdout, stderr] array
export async function execCmdWithExitOnFailure(
  cmd: string,
  args: string[],
  options?: SpawnOptions
) {
  const code = await execCmd(cmd, args, options)
  if (code !== 0) {
    process.exit(1)
  }
}

// TODO(asa): Use the contract kit here instead
export const erc20Abi = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'to',
        type: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'firstBlockWithReward',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
]

export const monorepoRoot = resolvePath(process.cwd(), './../..')

async function checkoutGethRepo(branch: string, path: string) {
  await execCmdWithExitOnFailure('rm', ['-rf', path])
  await execCmdWithExitOnFailure('git', [
    'clone',
    '--depth',
    '1',
    'https://github.com/celo-org/celo-blockchain.git',
    path,
    '-b',
    branch,
  ])
  await execCmdWithExitOnFailure('git', ['checkout', branch], { cwd: path })
}

async function buildGeth(path: string) {
  await execCmdWithExitOnFailure('make', ['geth'], { cwd: path })
}

async function setupTestDir(testDir: string) {
  await execCmd('rm', ['-rf', testDir])
  await execCmd('mkdir', [testDir])
}

function writeGenesis(validators: string[], path: string) {
  const blockTime = 0
  const epochLength = 10
  const genesis = generateGenesis(
    validators,
    ConsensusType.ISTANBUL,
    ['0x000000000000000000000000000000000000ce10'],
    blockTime,
    epochLength,
    networkid
  )
  fs.writeFileSync(path, genesis)
}

export function importGenesis() {
  return JSON.parse(fs.readFileSync(GENESIS_PATH).toString())
}

export async function init(gethBinaryPath: string, datadir: string, genesisPath: string) {
  await execCmdWithExitOnFailure('rm', ['-rf', datadir])
  await execCmdWithExitOnFailure(gethBinaryPath, ['--datadir', datadir, 'init', genesisPath])
}

export async function importPrivateKey(gethBinaryPath: string, instance: GethInstanceConfig) {
  const keyFile = '/tmp/key.txt'
  fs.writeFileSync(keyFile, instance.privateKey)
  await execCmdWithExitOnFailure(gethBinaryPath, [
    'account',
    'import',
    '--datadir',
    getDatadir(instance),
    '--password',
    '/dev/null',
    keyFile,
  ])
}

export async function killPid(pid: number) {
  await execCmd('kill', ['-9', pid.toString()])
}

export async function killGeth() {
  await execCmd('pkill', ['-9', 'geth'])
}

function addStaticPeers(datadir: string, enodes: string[]) {
  fs.writeFileSync(`${datadir}/static-nodes.json`, JSON.stringify(enodes))
}

async function isPortOpen(host: string, port: number) {
  return (await execCmd('nc', ['-z', host, port.toString()])) === 0
}

async function waitForPortOpen(host: string, port: number, seconds: number) {
  while (seconds > 0) {
    if (await isPortOpen(host, port)) {
      return true
    }
    seconds -= 1
    await sleep(1)
  }
  return false
}

export function sleep(seconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))
}

export async function getEnode(rpcPort: number) {
  const admin = new Admin(`http://localhost:${rpcPort}`)
  return (await admin.getNodeInfo()).enode
}

export async function startGeth(gethBinaryPath: string, instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  const { syncmode, port, rpcport, validating: mine } = instance
  const privateKey = instance.privateKey || ''
  const lightserv = instance.lightserv || false
  const unlock = instance.validating
  const etherbase = instance.etherbase || ''
  const gethArgs = [
    '--datadir',
    datadir,
    '--rpc',
    '--rpcport',
    rpcport.toString(),
    '--syncmode',
    syncmode,
    '--wsorigins=*',
    '--rpcapi=eth,net,web3,debug,admin,personal',
    '--debug',
    '--port',
    port.toString(),
    '--nodiscover',
    '--rpcvhosts=*',
    '--networkid',
    networkid.toString(),
    '--verbosity',
    '4',
    '--consoleoutput=stdout', // Send all logs to stdout
    '--consoleformat=term',
    '--nat',
    'extip:127.0.0.1',
  ]

  if (unlock) {
    gethArgs.push('--password=/dev/null', `--unlock=0`)
  }

  if (etherbase) {
    gethArgs.push('--etherbase', etherbase)
  }

  if (lightserv) {
    gethArgs.push('--lightserv=90')
  }

  if (mine) {
    gethArgs.push('--mine', '--minerthreads=10', `--nodekeyhex=${privateKey}`)
  }
  const gethProcess = spawnWithLog(gethBinaryPath, gethArgs, `${datadir}/logs.txt`)

  // Give some time for geth to come up
  const isOpen = await waitForPortOpen('localhost', rpcport, 5)
  if (!isOpen) {
    throw new Error("Geth Didn't finished starting after 5 seconds")
  }

  return gethProcess.pid
}

export async function migrateContracts(validatorPrivateKeys: string[], to: number = 1000) {
  const args = [
    '--cwd',
    `${monorepoRoot}/packages/protocol`,
    'init-network',
    '-n',
    'testing',
    '-k',
    validatorPrivateKeys.map(ensure0x).join(','),
    '-t',
    to.toString(),
  ]
  await execCmdWithExitOnFailure('yarn', args)
}

export function getContractAddress(contractName: string) {
  const filePath = `${monorepoRoot}/packages/protocol/build/testing/contracts/${contractName}.json`
  const contractData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return contractData.networks[networkid].address
}

export async function snapshotDatadir(instance: GethInstanceConfig) {
  // Sometimes the socket is still present, preventing us from snapshotting.
  await execCmd('rm', [`${getDatadir(instance)}/geth.ipc`])
  await execCmdWithExitOnFailure('cp', ['-r', getDatadir(instance), getSnapshotdir(instance)])
}

export async function restoreDatadir(instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  const snapshotdir = getSnapshotdir(instance)
  await execCmdWithExitOnFailure('rm', ['-rf', datadir])
  await execCmdWithExitOnFailure('cp', ['-r', snapshotdir, datadir])
}

function getInstanceDir(instance: GethInstanceConfig) {
  return joinPath(TEST_DIR, instance.name)
}

function getDatadir(instance: GethInstanceConfig) {
  return joinPath(getInstanceDir(instance), 'datadir')
}

function getSnapshotdir(instance: GethInstanceConfig) {
  return joinPath(getInstanceDir(instance), 'snapshot')
}

/**
 * @returns Promise<number> the geth pid number
 */
export async function initAndStartGeth(gethBinaryPath: string, instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  await init(gethBinaryPath, datadir, GENESIS_PATH)
  if (instance.privateKey) {
    await importPrivateKey(gethBinaryPath, instance)
  }
  if (instance.peers) {
    await addStaticPeers(datadir, instance.peers)
  }
  return startGeth(gethBinaryPath, instance)
}

export function getHooks(gethConfig: GethTestConfig) {
  const mnemonic =
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)
  const numValidators = validatorInstances.length
  const validators = getValidators(mnemonic, numValidators)
  const validatorPrivateKeys = validators.map((_: any, i: number) =>
    generatePrivateKey(mnemonic, AccountType.VALIDATOR, i)
  )
  const validatorEnodes = validatorPrivateKeys.map((x: any, i: number) =>
    getEnodeAddress(generatePublicKeyFromPrivateKey(x), '127.0.0.1', validatorInstances[i].port)
  )
  const argv = require('minimist')(process.argv.slice(2))
  const branch = argv.branch || 'master'
  const gethRepoPath = argv.localgeth || '/tmp/geth'
  const gethBinaryPath = `${gethRepoPath}/build/bin/geth`

  const before = async () => {
    if (!argv.localgeth) {
      await checkoutGethRepo(branch, gethRepoPath)
    }
    await buildGeth(gethRepoPath)
    await setupTestDir(TEST_DIR)
    await writeGenesis(validators, GENESIS_PATH)
    let validatorIndex = 0
    for (const instance of gethConfig.instances) {
      if (instance.validating) {
        if (!instance.peers) {
          instance.peers = []
        }
        // Automatically connect validator nodes to eachother.
        instance.peers = instance.peers.concat(
          validatorEnodes.filter((_: string, i: number) => i !== validatorIndex)
        )
        if (!instance.privateKey) {
          instance.privateKey = validatorPrivateKeys[validatorIndex]
        }
        validatorIndex++
      }
      await initAndStartGeth(gethBinaryPath, instance)
    }
    if (gethConfig.migrate || gethConfig.migrateTo) {
      await migrateContracts(validatorPrivateKeys, gethConfig.migrateTo)
    }
    await killGeth()
    await sleep(2)
    // Snapshot the datadir after the contract migrations so we can start from a "clean slate"
    // for every test.
    for (const instance of gethConfig.instances) {
      await snapshotDatadir(instance)
    }
  }

  const restart = async () => {
    await killGeth()
    let validatorIndex = 0
    for (const instance of gethConfig.instances) {
      await restoreDatadir(instance)
      if (!instance.privateKey && instance.validating) {
        instance.privateKey = validatorPrivateKeys[validatorIndex]
      }
      await startGeth(gethBinaryPath, instance)
      if (instance.validating) {
        validatorIndex++
      }
    }
  }

  const after = () => killGeth()

  return { before, after, restart, gethBinaryPath }
}

export async function assertRevert(promise: any, errorMessage: string = '') {
  try {
    await promise
    assert.fail('Expected revert not received')
  } catch (error) {
    const revertFound = error.message.search('revert') >= 0
    if (errorMessage === '') {
      assert(revertFound, `Expected "revert", got ${error} instead`)
    } else {
      assert(revertFound, errorMessage)
    }
  }
}
