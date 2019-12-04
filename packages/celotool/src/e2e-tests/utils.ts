import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import _ from 'lodash'
import { join as joinPath, resolve as resolvePath } from 'path'
import { Admin } from 'web3-eth-admin'
import {
  AccountType,
  getPrivateKeysFor,
  getValidatorsInformation,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '../lib/generate_utils'
import {
  GethInstanceConfig,
  GethRunConfig,
  getEnodeAddress,
  initAndStartGeth,
  restoreDatadir,
  snapshotDatadir,
  startGeth,
  writeGenesis,
  checkoutGethRepo,
  buildGeth,
  spawnWithLog,
  resetDataDir,
  connectValidatorPeers,
} from '../lib/geth'
import { ensure0x, spawnCmd, spawnCmdWithExitOnFailure } from '../lib/utils'

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

export async function killBootnode() {
  console.info(`Killing the bootnode`)
  await spawnCmd('pkill', ['-SIGINT', 'bootnode'], { silent: true })
}

export async function killGeth() {
  console.info(`Killing ALL geth instances`)
  await spawnCmd('pkill', ['-SIGINT', 'geth'], { silent: true })
}

export async function killInstance(instance: GethInstanceConfig) {
  if (instance.pid) {
    await spawnCmd('kill', ['-9', instance.pid.toString()])
  }
}

export function sleep(seconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))
}

export async function getEnode(port: number, ws: boolean = false) {
  const p = ws ? 'ws' : 'http'
  const admin = new Admin(`${p}://localhost:${port}`)
  return (await admin.getNodeInfo()).enode
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
  await spawnCmdWithExitOnFailure('yarn', args)
}

export async function startBootnode(
  bootnodeBinaryPath: string,
  mnemonic: string,
  gethConfig: GethRunConfig
) {
  const bootnodePrivateKey = getPrivateKeysFor(AccountType.BOOTNODE, mnemonic, 1)[0]
  const bootnodeLog = joinPath(gethConfig.runPath, 'bootnode.log')
  const bootnodeArgs = [
    '--verbosity=5',
    `--nodekeyhex=${bootnodePrivateKey}`,
    `--networkid=${gethConfig.networkId}`,
  ]

  spawnWithLog(bootnodeBinaryPath, bootnodeArgs, bootnodeLog, true)
  return getEnodeAddress(privateKeyToPublicKey(bootnodePrivateKey), '127.0.0.1', 30301)
}

export async function assertRevert(promise: any, errorMessage: string = ''): Promise<void> {
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

export function getHooks(gethConfig: GethRunConfig) {
  return getContext(gethConfig).hooks
}

export function getContext(gethConfig: GethRunConfig) {
  const mnemonic =
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)
  const numValidators = validatorInstances.length
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numValidators)
  const attestationKeys = getPrivateKeysFor(AccountType.ATTESTATION, mnemonic, numValidators)
  const validators = getValidatorsInformation(mnemonic, numValidators)

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
    await resetDataDir(gethConfig.runPath)
    await writeGenesis(validators, gethConfig)

    let bootnodeEnode: string = ''
    if (gethConfig.useBootnode) {
      bootnodeEnode = await startBootnode(bootnodeBinaryPath, mnemonic, gethConfig)
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
      await initAndStartGeth(gethBinaryPath, instance, true)
    }
    await connectValidatorPeers(gethConfig)

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
      await startBootnode(bootnodeBinaryPath, mnemonic, gethConfig)
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
        return startGeth(gethBinaryPath, instance, true)
      })
    )
    await connectValidatorPeers(gethConfig)
  }

  const after = () => killGeth()

  return {
    validators,
    hooks: { before, after, restart, gethBinaryPath },
  }
}
