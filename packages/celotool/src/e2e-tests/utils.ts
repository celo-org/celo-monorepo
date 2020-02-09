/* tslint:disable: no-console */
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import fs from 'fs'
import _ from 'lodash'
import { join as joinPath, resolve as resolvePath } from 'path'
import Web3 from 'web3'
import {
  AccountType,
  getPrivateKeysFor,
  getValidatorsInformation,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '../lib/generate_utils'
import {
  buildGeth,
  checkoutGethRepo,
  connectValidatorPeers,
  getEnodeAddress,
  initAndStartGeth,
  resetDataDir,
  restoreDatadir,
  snapshotDatadir,
  spawnWithLog,
  startGeth,
  writeGenesis,
} from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { ensure0x, spawnCmd, spawnCmdWithExitOnFailure } from '../lib/utils'

const MonorepoRoot = resolvePath(joinPath(__dirname, '../..', '../..'))
const verboseOutput = false

export async function waitToFinishInstanceSyncing(instance: GethInstanceConfig) {
  const { wsport, rpcport } = instance
  await waitToFinishSyncing(new Web3(`${rpcport ? 'http' : 'ws'}://localhost:${rpcport || wsport}`))
}

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
    const isCloseTo = actual
      .minus(expected)
      .abs()
      .lte(delta)
    assert(
      isCloseTo,
      `expected ${actual.toString()} to almost equal ${expected.toString()} +/- ${delta.toString()}`
    )
  }
}

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

export function sleep(seconds: number, verbose: boolean = false) {
  if (verbose) {
    console.log(`Sleeping for ${seconds} seconds. Stay tuned!`)
  }
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))
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
      downtimeSlasher: {
        slashableDowntime: 6,
      },
      election: {
        minElectableValidators: '1',
      },
      epochRewards: {
        frozen: false,
      },
      exchange: {
        frozen: false,
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
  gethConfig: GethRunConfig,
  verbose: boolean
) {
  const bootnodePrivateKey = getPrivateKeysFor(AccountType.BOOTNODE, mnemonic, 1)[0]
  const bootnodeLog = joinPath(gethConfig.runPath, 'bootnode.log')
  const bootnodeArgs = [
    '--verbosity=4',
    `--nodekeyhex=${bootnodePrivateKey}`,
    `--networkid=${gethConfig.networkId}`,
  ]

  spawnWithLog(bootnodeBinaryPath, bootnodeArgs, bootnodeLog, verbose)
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

export function getContext(gethConfig: GethRunConfig, verbose: boolean = verboseOutput) {
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
  const proxyEnodes = proxyPrivateKeys.map((x: string, i: number) => [
    proxyInstances[i].name,
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', proxyInstances[i].proxyport!),
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', proxyInstances[i].port),
  ])

  const argv = require('minimist')(process.argv.slice(2))
  const branch = argv.branch || 'master'

  gethConfig.gethRepoPath = argv.localgeth || '/tmp/geth'
  const gethBinaryPath = `${gethConfig.gethRepoPath}/build/bin/geth`
  const bootnodeBinaryPath = `${gethConfig.gethRepoPath}/build/bin/bootnode`

  const before = async () => {
    if (!argv.localgeth) {
      await checkoutGethRepo(branch, gethConfig.gethRepoPath!)
    }

    await buildGeth(gethConfig.gethRepoPath!)

    if (!gethConfig.keepData && fs.existsSync(gethConfig.runPath)) {
      await resetDataDir(gethConfig.runPath, verbose)
    }

    if (!fs.existsSync(gethConfig.runPath)) {
      // @ts-ignore
      fs.mkdirSync(gethConfig.runPath, { recursive: true })
    }

    await writeGenesis(gethConfig, validators, verbose)

    let bootnodeEnode: string = ''

    if (gethConfig.useBootnode) {
      bootnodeEnode = await startBootnode(bootnodeBinaryPath, mnemonic, gethConfig, verbose)
    }

    let validatorIndex = 0
    let proxyIndex = 0

    for (const instance of gethConfig.instances) {
      // Non proxied validators and proxies should connect to the bootnode
      if (!instance.isProxied) {
        if (gethConfig.useBootnode) {
          instance.bootnodeEnode = bootnodeEnode
        }
      } else {
        // Proxied validators should connect to only the proxy
        // Find this proxied validator's proxy
        const proxyEnode = proxyEnodes.filter((x: any) => x[0] === instance.proxy)

        if (proxyEnode.length !== 1) {
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
          (x: GethInstanceConfig) => x.proxy === instance.name
        )

        if (proxiedValidator.length !== 1) {
          throw new Error('proxied validator must have exactly one proxy')
        }

        instance.proxiedValidatorAddress = privateKeyToAddress(proxiedValidator[0].privateKey!)
      }
    }

    // Start all the instances
    for (const instance of gethConfig.instances) {
      await initAndStartGeth(gethConfig, gethBinaryPath, instance, verbose)
    }

    await connectValidatorPeers(gethConfig.instances)

    await Promise.all(
      gethConfig.instances.filter((i) => i.validating).map((i) => waitToFinishInstanceSyncing(i))
    )

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
      await snapshotDatadir(gethConfig.runPath, instance, verbose)
    }
  }

  const restart = async () => {
    await killGeth()

    if (gethConfig.useBootnode) {
      await killBootnode()
      await startBootnode(bootnodeBinaryPath, mnemonic, gethConfig, verbose)
    }

    // just in case
    gethConfig.keepData = true

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
        await restoreDatadir(gethConfig.runPath, instance)
        if (!instance.privateKey && instance.validating) {
          instance.privateKey = validatorPrivateKeys[validatorIndices[i]]
        }
        return startGeth(gethConfig, gethBinaryPath, instance, verbose)
      })
    )
    await connectValidatorPeers(gethConfig.instances)
  }

  const after = () => killGeth()

  return {
    validators,
    hooks: { before, after, restart, gethBinaryPath },
  }
}
