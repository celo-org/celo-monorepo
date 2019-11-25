import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import { spawn, SpawnOptions } from 'child_process'
import fs from 'fs'
import _ from 'lodash'
import { join as joinPath, resolve as resolvePath } from 'path'
import { Admin } from 'web3-eth-admin'
import {
  AccountType,
  generateGenesis,
  getPrivateKeysFor,
  getValidators,
  privateKeyToAddress,
  privateKeyToPublicKey,
  Validator,
} from '../lib/generate_utils'
import { getEnodeAddress } from '../lib/geth'
import { ensure0x } from '../lib/utils'

export interface GethInstanceConfig {
  name: string
  validating: boolean
  syncmode: string
  port: number
  proxyport?: number
  rpcport?: number
  wsport?: number
  lightserv?: boolean
  privateKey?: string
  etherbase?: string
  peers?: string[]
  proxies?: string[2][]
  pid?: number
  isProxied?: boolean
  isProxy?: boolean
  bootnodeEnode?: string
  proxy?: string
  proxiedValidatorAddress?: string
  ethstats?: string
}

export interface GethTestConfig {
  migrate?: boolean
  migrateTo?: number
  instances: GethInstanceConfig[]
  useBootnode?: boolean
  genesisConfig?: any
  migrationOverrides?: any
}

const TEST_DIR = '/tmp/e2e'
const GENESIS_PATH = `${TEST_DIR}/genesis.json`
const NetworkId = 1101
const MonorepoRoot = resolvePath(joinPath(__dirname, '../..', '../..'))

export async function waitToFinishSyncing(web3: any) {
  while ((await web3.eth.isSyncing()) || (await web3.eth.getBlockNumber()) === 0) {
    await sleep(0.1)
  }
}

export function assertAlmostEqual(
  actual: BigNumber,
  expected: BigNumber,
  delta: BigNumber = new BigNumber(10).pow(12).times(5)
) {
  if (expected.isZero()) {
    assert.equal(actual.toFixed(), expected.toFixed())
  } else {
    const isCloseTo = actual.plus(delta).gte(expected) || actual.minus(delta).lte(expected)
    assert(
      isCloseTo,
      `expected ${actual.toString()} to almost equal ${expected.toString()} +/- ${delta.toString()}`
    )
  }
}

export function spawnWithLog(cmd: string, args: string[], logsFilepath: string) {
  try {
    fs.unlinkSync(logsFilepath)
  } catch (error) {
    // nothing to do
  }
  const logStream = fs.createWriteStream(logsFilepath, { flags: 'a' })
  console.log(cmd)
  console.log(args)
  const process = spawn(cmd, args)
  process.stdout.pipe(logStream)
  process.stderr.pipe(logStream)
  return process
}

export function execCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
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

// Returns a Promise which resolves to [stdout, stderr] array
export async function execCmdWithExitOnFailure(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  const code = await execCmd(cmd, args, options)
  if (code !== 0) {
    console.error('execCmd failed for: ' + [cmd].concat(args).join(' '))
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

export function writeGenesis(validators: Validator[], path: string, configOverrides: any = {}) {
  const genesis = generateGenesis({
    validators,
    blockTime: 0,
    epoch: 10,
    lookback: 2,
    requestTimeout: 3000,
    chainId: NetworkId,
    ...configOverrides,
  })
  fs.writeFileSync(path, genesis)
}

export function importGenesis() {
  return JSON.parse(fs.readFileSync(GENESIS_PATH).toString())
}

export async function init(gethBinaryPath: string, datadir: string, genesisPath: string) {
  await execCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: true })
  await execCmdWithExitOnFailure(gethBinaryPath, ['--datadir', datadir, 'init', genesisPath], {
    silent: false,
  })
}

export async function importPrivateKey(gethBinaryPath: string, instance: GethInstanceConfig) {
  const keyFile = `/${getDatadir(instance)}/key.txt`
  fs.writeFileSync(keyFile, instance.privateKey)
  console.info(`geth:${instance.name}: import account`)
  await execCmdWithExitOnFailure(
    gethBinaryPath,
    ['account', 'import', '--datadir', getDatadir(instance), '--password', '/dev/null', keyFile],
    { silent: true }
  )
}

export async function killBootnode() {
  console.info(`Killing the bootnode`)
  await execCmd('pkill', ['-SIGINT', 'bootnode'], { silent: true })
}

export async function killGeth() {
  console.info(`Killing ALL geth instances`)
  await execCmd('pkill', ['-SIGINT', 'geth'], { silent: true })
}

export async function killInstance(instance: GethInstanceConfig) {
  if (instance.pid) {
    await execCmd('kill', ['-9', instance.pid.toString()])
  }
}

export async function addStaticPeers(datadir: string, enodes: string[]) {
  fs.writeFileSync(`${datadir}/static-nodes.json`, JSON.stringify(enodes))
}

export async function addProxyPeer(gethBinaryPath: string, instance: GethInstanceConfig) {
  if (instance.proxies) {
    await execCmdWithExitOnFailure(gethBinaryPath, [
      '--datadir',
      getDatadir(instance),
      'attach',
      '--exec',
      `istanbul.addProxy('${instance.proxies[0]!}', '${instance.proxies[1]!}')`,
    ])
  }
}

async function isPortOpen(host: string, port: number) {
  return (await execCmd('nc', ['-z', host, port.toString()], { silent: true })) === 0
}

async function waitForPortOpen(host: string, port: number, seconds: number) {
  const deadline = Date.now() + seconds * 1000
  do {
    if (await isPortOpen(host, port)) {
      return true
    }
  } while (Date.now() < deadline)
  return false
}

export function sleep(seconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))
}

export async function getEnode(port: number, ws: boolean = false) {
  const p = ws ? 'ws' : 'http'
  const admin = new Admin(`${p}://localhost:${port}`)
  return (await admin.getNodeInfo()).enode
}

export async function startGeth(gethBinaryPath: string, instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  const {
    syncmode,
    port,
    rpcport,
    wsport,
    validating,
    bootnodeEnode,
    isProxy,
    isProxied,
    proxyport,
    ethstats,
  } = instance
  const privateKey = instance.privateKey || ''
  const lightserv = instance.lightserv || false
  const etherbase = instance.etherbase || ''
  const gethArgs = [
    '--datadir',
    datadir,
    '--syncmode',
    syncmode,
    '--debug',
    '--port',
    port.toString(),
    '--rpcvhosts=*',
    '--networkid',
    NetworkId.toString(),
    '--verbosity',
    '5',
    '--consoleoutput=stdout', // Send all logs to stdout
    '--consoleformat=term',
    '--nat',
    'extip:127.0.0.1',
  ]

  if (rpcport) {
    gethArgs.push(
      '--rpc',
      '--rpcport',
      rpcport.toString(),
      '--rpccorsdomain=*',
      '--rpcapi=eth,net,web3,debug,admin,personal,txpool,istanbul'
    )
  }

  if (wsport) {
    gethArgs.push(
      '--wsorigins=*',
      '--ws',
      '--wsport',
      wsport.toString(),
      '--wsapi=eth,net,web3,debug,admin,personal'
    )
  }

  if (etherbase) {
    gethArgs.push('--etherbase', etherbase)
  }

  if (lightserv) {
    gethArgs.push('--lightserv=90')
  }

  if (validating) {
    gethArgs.push('--mine', '--minerthreads=10', `--nodekeyhex=${privateKey}`)

    if (isProxied) {
      gethArgs.push('--proxy.proxied')
    }
  } else if (isProxy) {
    gethArgs.push('--proxy.proxy')
    if (proxyport) {
      gethArgs.push(`--proxy.internalendpoint=127.0.0.1:${proxyport.toString()}`)
    }
    gethArgs.push(`--proxy.proxiedvalidatoraddress=${instance.proxiedValidatorAddress}`)
    gethArgs.push(`--nodekeyhex=${privateKey}`)
  }

  if (bootnodeEnode) {
    gethArgs.push(`--bootnodes=${bootnodeEnode}`)
  } else {
    gethArgs.push('--nodiscover')
  }

  if (isProxied && instance.proxies) {
    gethArgs.push(`--proxy.proxyenodeurlpair=${instance.proxies[0]!};${instance.proxies[1]!}`)
  }

  if (privateKey) {
    gethArgs.push('--password=/dev/null', `--unlock=0`)
  }

  if (!!ethstats) {
    gethArgs.push(`--ethstats=${instance.name}@${ethstats}`)
  }
  const gethProcess = spawnWithLog(gethBinaryPath, gethArgs, `${datadir}/logs.txt`)
  instance.pid = gethProcess.pid

  // Give some time for geth to come up
  const waitForPort = wsport ? wsport : rpcport
  if (waitForPort) {
    const isOpen = await waitForPortOpen('localhost', waitForPort, 10)
    if (!isOpen) {
      console.error(`geth:${instance.name}: jsonRPC didn't open after 5 seconds`)
      process.exit(1)
    } else {
      console.info(`geth:${instance.name}: jsonRPC port open ${waitForPort}`)
    }
  }

  return instance
}

export async function migrateContracts(
  validatorPrivateKeys: string[],
  attestationKeys: string[],
  validators: string[],
  to: number = 1000,
  overrides: any = {}
) {
  const migrationOverrides = _.merge(
    {
      election: {
        minElectableValidators: '1',
      },
      stableToken: {
        initialBalances: {
          addresses: validators.map(ensure0x),
          values: validators.map(() => '10000000000000000000000'),
        },
      },
      validators: {
        validatorKeys: validatorPrivateKeys.map(ensure0x),
        attestationKeys: attestationKeys.map(ensure0x),
      },
    },
    overrides
  )

  const args = [
    '--cwd',
    `${MonorepoRoot}/packages/protocol`,
    'init-network',
    '-n',
    'testing',
    '-m',
    JSON.stringify(migrationOverrides),
    '-t',
    to.toString(),
  ]
  await execCmdWithExitOnFailure('yarn', args)
}

export function getContractAddress(contractName: string) {
  const filePath = `${MonorepoRoot}/packages/protocol/build/testing/contracts/${contractName}.json`
  const contractData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return contractData.networks[NetworkId].address
}

export async function snapshotDatadir(instance: GethInstanceConfig) {
  // Sometimes the socket is still present, preventing us from snapshotting.
  await execCmd('rm', [`${getDatadir(instance)}/geth.ipc`], { silent: true })
  await execCmdWithExitOnFailure('cp', ['-r', getDatadir(instance), getSnapshotdir(instance)])
}

export async function restoreDatadir(instance: GethInstanceConfig) {
  const datadir = getDatadir(instance)
  const snapshotdir = getSnapshotdir(instance)
  console.info(`geth:${instance.name}: restore datadir: ${datadir}`)
  await execCmdWithExitOnFailure('rm', ['-rf', datadir], { silent: true })
  await execCmdWithExitOnFailure('cp', ['-r', snapshotdir, datadir], { silent: true })
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
  console.info(`geth:${instance.name}: init datadir ${datadir}`)
  await init(gethBinaryPath, datadir, GENESIS_PATH)
  if (instance.privateKey) {
    await importPrivateKey(gethBinaryPath, instance)
  }
  if (instance.peers) {
    await addStaticPeers(datadir, instance.peers)
  }
  return startGeth(gethBinaryPath, instance)
}

export async function startBootnode(bootnodeBinaryPath: string, mnemonic: string) {
  const bootnodePrivateKey = getPrivateKeysFor(AccountType.BOOTNODE, mnemonic, 1)[0]
  const bootnodeLog = joinPath(TEST_DIR, 'bootnode.log')
  const bootnodeArgs = [
    '--verbosity=5',
    `--nodekeyhex=${bootnodePrivateKey}`,
    `--networkid=${NetworkId}`,
  ]

  spawnWithLog(bootnodeBinaryPath, bootnodeArgs, bootnodeLog)
  return getEnodeAddress(privateKeyToPublicKey(bootnodePrivateKey), '127.0.0.1', 30301)
}

export function getContext(gethConfig: GethTestConfig) {
  const mnemonic =
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)
  const numValidators = validatorInstances.length
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numValidators)
  const attestationKeys = getPrivateKeysFor(AccountType.ATTESTATION, mnemonic, numValidators)
  const validators = getValidators(mnemonic, numValidators)

  const proxyInstances = gethConfig.instances.filter((x: any) => x.isProxy)
  const numProxies = proxyInstances.length
  const proxyPrivateKeys = getPrivateKeysFor(AccountType.PROXY, mnemonic, numProxies)
  const proxyEnodes = proxyPrivateKeys.map((x: any, i: number) => [
    proxyInstances[i].name,
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', proxyInstances[i].proxyport!),
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', proxyInstances[i].port),
  ])

  const argv = require('minimist')(process.argv.slice(2))
  const branch = argv.branch || 'master'
  const gethRepoPath = argv.localgeth || '/tmp/geth'
  const gethBinaryPath = `${gethRepoPath}/build/bin/geth`

  const bootnodeBinaryPath = `${gethRepoPath}/build/bin/bootnode`

  const before = async () => {
    if (!argv.localgeth) {
      await checkoutGethRepo(branch, gethRepoPath)
    }
    await buildGeth(gethRepoPath)
    await setupTestDir(TEST_DIR)
    await writeGenesis(validators, GENESIS_PATH, gethConfig.genesisConfig)

    let bootnodeEnode: string = ''
    if (gethConfig.useBootnode) {
      bootnodeEnode = await startBootnode(bootnodeBinaryPath, mnemonic)
    }
    let validatorIndex = 0
    let proxyIndex = 0
    for (const instance of gethConfig.instances) {
      // Non proxied validators and proxies should connect to the bootnode
      if ((instance.validating && !instance.isProxied) || instance.isProxy) {
        if (gethConfig.useBootnode) {
          instance.bootnodeEnode = bootnodeEnode
        }
      } else if (instance.validating && instance.isProxied) {
        // Proxied validators should connect to only the proxy
        // Find this proxied validator's proxy
        const proxyEnode = proxyEnodes.filter((x: any, _: number) => x[0] === instance.proxy)

        if (proxyEnode.length != 1) {
          throw new Error('proxied validator must have exactly one proxy')
        }

        instance.proxies = [proxyEnode[0][1]!, proxyEnode[0][2]!]
      }

      // Set the private key for the validator or proxy instance
      if (instance.validating) {
        instance.privateKey = instance.privateKey || validatorPrivateKeys[validatorIndex]
        validatorIndex++
      } else if (instance.isProxy) {
        instance.privateKey = instance.privateKey || proxyPrivateKeys[proxyIndex]
        proxyIndex++
      }
    }

    // The proxies will need to know their proxied validator's address
    for (const instance of gethConfig.instances) {
      if (instance.isProxy) {
        const proxiedValidator = gethConfig.instances.filter(
          (x: GethInstanceConfig, _: number) => x.proxy == instance.name
        )

        if (proxiedValidator.length != 1) {
          throw new Error('proxied validator must have exactly one proxy')
        }

        instance.proxiedValidatorAddress = privateKeyToAddress(proxiedValidator[0].privateKey!)
      }
    }

    // Start all the instances
    for (const instance of gethConfig.instances) {
      await initAndStartGeth(gethBinaryPath, instance)
    }

    // Give validators time to connect to each other
    await sleep(60)

    if (gethConfig.migrate || gethConfig.migrateTo) {
      await migrateContracts(
        validatorPrivateKeys,
        attestationKeys,
        validators.map((x) => x.address),
        gethConfig.migrateTo,
        gethConfig.migrationOverrides
      )
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
    if (gethConfig.useBootnode) {
      killBootnode()
      await startBootnode(bootnodeBinaryPath, mnemonic)
    }
    let validatorIndex = 0
    const validatorIndices: number[] = []
    for (const instance of gethConfig.instances) {
      validatorIndices.push(validatorIndex)
      if (instance.validating) {
        validatorIndex++
      }
    }
    await Promise.all(
      gethConfig.instances.map(async (instance, i) => {
        await restoreDatadir(instance)
        if (!instance.privateKey && instance.validating) {
          instance.privateKey = validatorPrivateKeys[validatorIndices[i]]
        }
        return startGeth(gethBinaryPath, instance)
      })
    )
  }

  const after = () => killGeth()

  return {
    validators,
    hooks: { before, after, restart, gethBinaryPath },
  }
}

export function getHooks(gethConfig: GethTestConfig) {
  return getContext(gethConfig).hooks
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
