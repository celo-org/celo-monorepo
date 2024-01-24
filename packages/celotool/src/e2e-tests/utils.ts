import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import fs from 'fs'
import { join as joinPath, resolve as resolvePath } from 'path'
import readLastLines from 'read-last-lines'
import Web3 from 'web3'
import { spawnCmd, spawnCmdWithExitOnFailure } from '../lib/cmd-utils'
import { envVar, fetchEnvOrFallback } from '../lib/env-utils'
import {
  AccountType,
  getPrivateKeysFor,
  getValidatorsInformation,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '../lib/generate_utils'
import {
  buildGeth,
  buildGethAll,
  checkoutGethRepo,
  connectPeers,
  connectValidatorPeers,
  getEnodeAddress,
  getLogFilename,
  initAndStartGeth,
  initGeth,
  migrateContracts,
  resetDataDir,
  restoreDatadir,
  snapshotDatadir,
  startGeth,
  writeGenesis,
  writeGenesisWithMigrations,
} from '../lib/geth'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRepository } from '../lib/interfaces/geth-repository'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { stringToBoolean } from '../lib/utils'

const MonorepoRoot = resolvePath(joinPath(__dirname, '../..', '../..'))
const verboseOutput = false
// The mnemonic used for the e2e tests
export const mnemonic =
  'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'

export async function initAndSyncGethWithRetry(
  gethConfig: GethRunConfig,
  gethBinaryPath: string,
  instance: GethInstanceConfig,
  connectInstances: GethInstanceConfig[],
  verbose: boolean,
  retries: number
) {
  for (let i = 1; i <= retries; i++) {
    try {
      await initAndStartGeth(gethConfig, gethBinaryPath, instance, verbose)
      await connectPeers(connectInstances, verbose)
      await waitToFinishInstanceSyncing(instance)
      break
    } catch (error) {
      // eslint-disable-next-line  @typescript-eslint/restrict-template-expressions
      console.info(`initAndSyncGethWithRetry error: ${error}`)
      const logFilename = getLogFilename(gethConfig.runPath, instance)
      console.info(`tail -50 ${logFilename}`)
      console.info(await readLastLines.read(logFilename, 50))
      if (i === retries) {
        throw error
      } else {
        console.info(`Retrying ${i}/${retries} ...`)
        await killInstance(instance)
        continue
      }
    }
  }
  return instance
}

export async function waitToFinishInstanceSyncing(instance: GethInstanceConfig) {
  const { wsport, rpcport } = instance
  console.info(`${instance.name}: syncing start`)
  await waitToFinishSyncing(new Web3(`${rpcport ? 'http' : 'ws'}://localhost:${rpcport || wsport}`))
  console.info(`${instance.name}: syncing finished`)
}

export async function waitToFinishSyncing(web3: any) {
  while ((await web3.eth.isSyncing()) || (await web3.eth.getBlockNumber()) === 0) {
    await sleep(0.1)
  }
}

export async function waitForBlock(web3: Web3, blockNumber: number) {
  // const epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
  let currentBlock: number
  do {
    currentBlock = await web3.eth.getBlockNumber()
    await sleep(0.1)
  } while (currentBlock < blockNumber)
}

export async function waitForEpochTransition(web3: Web3, epoch: number) {
  // const epoch = new BigNumber(await validators.methods.getEpochSize().call()).toNumber()
  let blockNumber: number
  do {
    blockNumber = await web3.eth.getBlockNumber()
    await sleep(0.1)
  } while (blockNumber % epoch !== 1)
}

export async function waitForAnnounceToStabilize(web3: Web3) {
  // Due to a problem in the announce protocol's settings, it can take a minute for all the validators
  // to be aware of each other even though they are connected.  This can lead to the first validator missing
  // block signatures initially.  So we wait for that to pass.
  // Before we used mycelo, this wasn't noticeable because the migrations  meant that the network would have
  // been running for close to 10 minutes already, which was more than enough time.
  // TODO: This function and its uses can be removed after the announce startup behavior has been resolved.
  await waitForBlock(web3, 70)
}

export function assertAlmostEqual(
  actual: BigNumber,
  expected: BigNumber,
  delta: BigNumber = new BigNumber(10).pow(12).times(5)
) {
  if (expected.isZero()) {
    assert.equal(actual.toFixed(), expected.toFixed())
  } else {
    const isCloseTo = actual.minus(expected).abs().lte(delta)
    assert(
      isCloseTo,
      `expected ${actual.toString()} to almost equal ${expected.toString()} +/- ${delta.toString()}`
    )
  }
}

type Signal = 'TERM' | 'KILL' | 'INT' | 'STOP' | 'CONT'

export async function signalProcess(identifier: string | number, signal: Signal): Promise<void> {
  const result =
    typeof identifier === 'number'
      ? await spawnCmd('kill', ['-s', signal, identifier.toString()], { silent: true })
      : await spawnCmd('pkill', [`-SIG${signal}`, identifier], { silent: true })

  if (result !== 0) {
    console.warn(`Attempt to send signal ${signal} to ${identifier} exited with code ${result}`)
  }
}

export async function processIsRunning(identifier: string | number): Promise<boolean> {
  if (typeof identifier === 'number') {
    return (await spawnCmd('kill', ['-0', identifier.toString()], { silent: true })) === 0
  } else {
    return (await spawnCmd('pgrep', [identifier], { silent: true })) === 0
  }
}

export async function killGeth() {
  console.info(`Killing ALL geth instances`)
  await shutdownOrKill('geth')
}

export async function killInstance(instance: GethInstanceConfig) {
  if (instance.pid) {
    await signalProcess(instance.pid, 'KILL')
  }
}

export async function shutdownOrKill(identifier: string | number, signal: Signal = 'INT') {
  await signalProcess(identifier, signal)

  // Poll for remaining processes for up to ~30s with exponential backoff.
  let processRemaining = true
  for (let i = 0; i < 10 && processRemaining; i++) {
    await sleep(0.03 * Math.pow(2, i))
    processRemaining = await processIsRunning(identifier)
  }

  if (processRemaining) {
    console.warn('shutdownOrKill: clean shutdown failed')
    await signalProcess(identifier, 'KILL')
  }

  // Sleep an additional 3 seconds to give time for the ports to be free.
  await sleep(3.0)
}

export function sleep(seconds: number, verbose = false) {
  if (verbose) {
    console.info(`Sleeping for ${seconds} seconds. Stay tuned!`)
  }
  return new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000))
}

export async function assertRevert(promise: any, errorMessage: string = ''): Promise<void> {
  try {
    await promise
    assert.fail('Expected revert not received')
  } catch (error: any) {
    const revertFound = error.message.search('revert') >= 0
    if (errorMessage === '') {
      assert(revertFound, `Expected "revert", got ${error} instead`)
    } else {
      assert(revertFound, errorMessage)
    }
  }
}

function gethRepositoryFromFlags() {
  const argv = require('minimist')(process.argv.slice(2))
  return {
    path: argv.localgeth || '/tmp/geth',
    remote: !argv.localgeth,
    branch: argv.branch,
  }
}

export function getHooks(gethConfig: GethRunConfig) {
  return getContext(gethConfig, true).hooks
}

export function getContext(gethConfig: GethRunConfig, verbose: boolean = verboseOutput) {
  // Use of mycelo can be enabled through gethConfig or through an env variable
  const useMycelo =
    !!gethConfig.useMycelo ||
    stringToBoolean(fetchEnvOrFallback(envVar.E2E_TESTS_FORCE_USE_MYCELO, 'false'))
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)

  const numValidators = validatorInstances.length

  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numValidators)
  const attestationKeys = getPrivateKeysFor(AccountType.ATTESTATION, mnemonic, numValidators)
  const validators = getValidatorsInformation(mnemonic, numValidators)

  const proxyInstances = gethConfig.instances.filter((x: any) => x.isProxy)
  const numProxies = proxyInstances.length

  const proxyNodeKeys = getPrivateKeysFor(AccountType.PROXY, mnemonic, numProxies)
  const proxyEnodes = proxyNodeKeys.map((x: string, i: number) => [
    proxyInstances[i].name,
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', proxyInstances[i].proxyport),
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', proxyInstances[i].port),
  ])

  const repo: GethRepository = gethConfig.repository || gethRepositoryFromFlags()
  const gethBinaryPath = `${repo.path}/build/bin/geth`
  const initialize = async () => {
    if (repo.remote) {
      await checkoutGethRepo(repo.branch || 'master', repo.path)
    }

    if (useMycelo) {
      await buildGethAll(repo.path)
    } else {
      await buildGeth(repo.path)
    }

    if (!gethConfig.keepData && fs.existsSync(gethConfig.runPath)) {
      await resetDataDir(gethConfig.runPath, verbose)
    }

    if (!fs.existsSync(gethConfig.runPath)) {
      fs.mkdirSync(gethConfig.runPath, { recursive: true })
    }

    if (useMycelo) {
      // Compile the contracts first because mycelo assumes they are compiled already, unless told not to
      if (!gethConfig.myceloSkipCompilingContracts) {
        await spawnCmdWithExitOnFailure('yarn', ['truffle', 'compile'], {
          cwd: `${MonorepoRoot}/packages/protocol`,
        })
      }
      await writeGenesisWithMigrations(gethConfig, repo.path, mnemonic, validators.length, verbose)
    } else {
      writeGenesis(gethConfig, validators, verbose)
    }

    let validatorIndex = 0
    let proxyIndex = 0

    for (const instance of gethConfig.instances) {
      if (instance.isProxied) {
        // Proxied validators should connect to only the proxy
        // Find this proxied validator's proxy
        const proxyEnode = proxyEnodes.filter((x: any) => x[0] === instance.proxy)

        if (proxyEnode.length !== 1) {
          throw new Error('proxied validator must have exactly one proxy')
        }

        instance.proxies = [proxyEnode[0][1], proxyEnode[0][2]]
      }

      // Set the private key for the validator or proxy instance
      if (instance.validating) {
        instance.privateKey = instance.privateKey || validatorPrivateKeys[validatorIndex]
        validatorIndex++
      } else if (instance.isProxy) {
        instance.nodekey = instance.privateKey || proxyNodeKeys[proxyIndex]
        proxyIndex++
      }

      if (!instance.minerValidator && (instance.validating || instance.isProxied)) {
        instance.minerValidator = privateKeyToAddress(instance.privateKey)
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

        instance.proxiedValidatorAddress = privateKeyToAddress(proxiedValidator[0].privateKey)
      }
    }

    if (useMycelo || !(gethConfig.migrate || gethConfig.migrateTo)) {
      // Just need to initialize the nodes in this case.  No need to actually start the network
      // since we don't need to run the migrations against it.
      for (const instance of gethConfig.instances) {
        await initGeth(gethConfig, gethBinaryPath, instance, verbose)
      }
      return
    }

    // Start all the instances
    for (const instance of gethConfig.instances) {
      await initAndStartGeth(gethConfig, gethBinaryPath, instance, verbose)
    }

    // Directly connect validator peers that are not using a bootnode or proxy.
    await connectValidatorPeers(gethConfig.instances)

    await Promise.all(
      gethConfig.instances.filter((i) => i.validating).map((i) => waitToFinishInstanceSyncing(i))
    )

    await migrateContracts(
      MonorepoRoot,
      validatorPrivateKeys,
      attestationKeys,
      validators.map((x) => x.address),
      gethConfig.migrateTo,
      gethConfig.migrationOverrides
    )
  }

  const before = async () => {
    await initialize()

    await killGeth()

    // Snapshot the datadir after the contract migrations so we can start from a "clean slate"
    // for every test.
    for (const instance of gethConfig.instances) {
      await snapshotDatadir(gethConfig.runPath, instance, verbose)
    }
  }

  const restart = async () => {
    await killGeth()

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

    // restore data dirs
    await Promise.all(
      gethConfig.instances.map((instance) => restoreDatadir(gethConfig.runPath, instance))
    )

    // do in sequence, not concurrently to avoid flaky errors
    for (let i = 0; i < gethConfig.instances.length; i++) {
      const instance = gethConfig.instances[i]
      if (!instance.privateKey && instance.validating) {
        instance.privateKey = validatorPrivateKeys[validatorIndices[i]]
      }

      if (!instance.minerValidator && (instance.validating || instance.isProxied)) {
        instance.minerValidator = privateKeyToAddress(instance.privateKey!)
      }

      await startGeth(gethConfig, gethBinaryPath, instance, verbose)
    }

    await connectValidatorPeers(gethConfig.instances)
  }

  const after = () => killGeth()

  return {
    validators,
    hooks: { initialize, before, after, restart, gethBinaryPath },
  }
}
