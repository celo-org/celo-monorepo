import { CeloTx } from '@celo/connect'
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import * as ejsRlp from '@ethereumjs/rlp'
import * as ejsUtil from '@ethereumjs/util'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import { keccak256 } from 'ethereum-cryptography/keccak'
import { toHex } from 'ethereum-cryptography/utils'
import lodash from 'lodash'
import Web3 from 'web3'
import { AccountType, generatePrivateKey } from '../lib/generate_utils'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { ensure0x } from '../lib/utils'
import { getHooks, initAndSyncGethWithRetry, mnemonic, sleep } from './utils'

const TMP_PATH = '/tmp/e2e'
const validatorUrl = 'http://localhost:8545'
const lightUrl = 'http://localhost:8546'

const notYetActivatedError = 'support for eth-compatible transactions is not enabled'
const notCompatibleError = 'ethCompatible is true, but non-eth-compatible fields are present'
const noReplayProtectionError = 'only replay-protected (EIP-155) transactions allowed over RPC'

const validatorPrivateKey = generatePrivateKey(mnemonic, AccountType.VALIDATOR, 0)
const validatorAddress = privateKeyToAddress(validatorPrivateKey)
// Arbitrary addresses to use in the transactions
const toAddress = '0x8c36775E95A5f7FEf6894Ba658628352Ac58605B'
const gatewayFeeRecipientAddress = '0xc77538d1e30C0e4ec44B0DcaD97FD3dc63fcaCC4'

// Simple contract with a single constant
const bytecode =
  '0x608060405260008055348015601357600080fd5b5060358060216000396000f3006080604052600080fd00a165627a7a72305820c7f3f7c299940bb1d9b122d25e8f288817e45bbdeaccdd2f6e8801677ed934e70029'

const verbose = false

/// ////// Configurable values to run only some of the tests during development ////////////////
// ReplayProtectionTests lets you skip or run only the replay-protection tests during dev
// Value when committing should be "run"
// eslint-disable-next-line
let replayProtectionTests: 'run' | 'skip' | 'only' = 'run'
// devFilter can be used during development to only run a subset of testcases.
// But if you're going to commit you should set them all back to undefined (i.e. no filter).
const devFilter: Filter = {
  cipIsActivated: undefined,
  lightNode: undefined,
  ethCompatible: undefined,
  contractCreation: undefined,
  useFeeCurrency: undefined,
  useGatewayFee: undefined,
  useGatewayFeeRecipient: undefined,
  sendRawTransaction: undefined,
}
/// ////////////////////////////////////////////////////////////////////////////////////////////

// Filter specifies which subset of cases to generate.
// (e.g. {lightNode: true, sendRawTransaction: false} makes it only run cases which send through a light
// node using `eth_sendRawTransaction`
type Filter = Partial<TestCase>

// TestCase describes the specific case we want to test
interface TestCase {
  cipIsActivated: boolean
  lightNode: boolean
  ethCompatible: boolean
  contractCreation: boolean
  useFeeCurrency: boolean
  useGatewayFee: boolean
  useGatewayFeeRecipient: boolean
  sendRawTransaction: boolean // whether to use eth_sendRawTransaction ot eth_sendTransaction
  errorString: string | null
  errorReason: string | null
}

// generateTestCases is used to generate all the cases we want to test for a setup which
// is either pre-Donut or post-Donut (cipIsActivated true means post-Donut)
function generateTestCases(cipIsActivated: boolean) {
  const cases: TestCase[] = []
  if (devFilter.cipIsActivated !== undefined && devFilter.cipIsActivated !== cipIsActivated) {
    // The devFilter is incompatible with the cipIsActivated value, so there are no cases to run
    return cases
  }
  const getValues = (fieldFilter: boolean | undefined) => {
    return fieldFilter === undefined ? [false, true] : [fieldFilter]
  }
  // Generate all possible combinations (but some are invalid and excluded using 'continue' below)
  for (const lightNode of getValues(devFilter.lightNode)) {
    for (const ethCompatible of getValues(devFilter.ethCompatible)) {
      for (const contractCreation of getValues(devFilter.contractCreation)) {
        for (const useFeeCurrency of getValues(devFilter.useFeeCurrency)) {
          for (const useGatewayFee of getValues(devFilter.useGatewayFee)) {
            for (const useGatewayFeeRecipient of getValues(devFilter.useGatewayFeeRecipient)) {
              for (const sendRawTransaction of getValues(devFilter.sendRawTransaction)) {
                let errorString: string | null = null
                let errorReason: string | null = null
                const hasCeloFields = useFeeCurrency || useGatewayFee || useGatewayFeeRecipient
                if (ethCompatible && hasCeloFields) {
                  errorString = notCompatibleError
                  errorReason = 'transaction has celo-only fields'
                } else if (ethCompatible && !cipIsActivated) {
                  errorString = notYetActivatedError
                  errorReason = 'Donut is not activated'
                }
                if (sendRawTransaction && ethCompatible && hasCeloFields) {
                  // Such scenarios don't make sense, since eth-compatible transactions in RLP can't have
                  // these fields.  So skip these cases.
                  continue
                }
                cases.push({
                  cipIsActivated,
                  lightNode,
                  ethCompatible,
                  contractCreation,
                  useFeeCurrency,
                  useGatewayFee,
                  useGatewayFeeRecipient,
                  sendRawTransaction,
                  errorString,
                  errorReason,
                })
              }
            }
          }
        }
      }
    }
  }
  return cases
}

function getGethRunConfig(withDonut: boolean, withEspresso: boolean): GethRunConfig {
  console.info('getGethRunConfig', withDonut)
  return {
    migrate: true,
    runPath: TMP_PATH,
    keepData: false,
    networkId: 1101,
    network: 'local',
    genesisConfig: {
      churritoBlock: 0,
      donutBlock: withDonut ? 0 : null,
      espressoBlock: withEspresso ? 0 : null,
      gingerbreadBlock: null,
    },
    instances: [
      {
        name: 'validator',
        validating: true,
        syncmode: 'full',
        lightserv: true,
        port: 30303,
        rpcport: 8545,
      },
    ],
  }
}

/**
 * Copied from ethereumjs-utils
 * Trims leading zeros from a `Buffer` or `Number[]`.
 * @param a (Buffer|Uint8Array)
 * @return (Buffer|Uint8Array)
 */
function stripZeros(a: any): Buffer | Uint8Array {
  let first = a[0]
  while (a.length > 0 && first.toString() === '0') {
    a = a.slice(1)
    first = a[0]
  }
  return a
}

// TestEnv encapsulates a pre-Donut or post-Donut environment and the tests to run on it
class TestEnv {
  testCases: TestCase[]
  gethConfig: GethRunConfig
  cipIsActivated: boolean
  replayProtectionIsNotMandatory: boolean
  hooks: ReturnType<typeof getHooks>
  stableTokenAddr: string = ''
  gasPrice: string = ''

  // There are three cases: (a), (b), and (c) below.
  // And, for each of these three cases, we have one which connects to the validator and one which
  // connects to the light client.
  // (a) contractkit instances without the private key, for transacting using `eth_sendTransaction`
  kit: ContractKit
  kitLight: ContractKit
  // (b) contractkit instances with the private key, for signing locally (to then use `eth_sendRawTransaction`)
  kitWithLocalWallet: ContractKit
  kitWithLocalWalletLight: ContractKit
  // (c) web3 instances with the private key, for generating and signing raw eth-compatible transactions (to then
  // use with `eth_sendRawTransaction`)
  web3: Web3
  web3Light: Web3

  constructor(cipIsActivated: boolean, replayProtectionIsNotMandatory: boolean) {
    this.gethConfig = getGethRunConfig(cipIsActivated, replayProtectionIsNotMandatory)
    this.hooks = getHooks(this.gethConfig)
    this.cipIsActivated = cipIsActivated
    this.replayProtectionIsNotMandatory = replayProtectionIsNotMandatory
    this.testCases = generateTestCases(cipIsActivated)
    this.kit = newKitFromWeb3(new Web3(validatorUrl))
    this.kitLight = newKitFromWeb3(new Web3(lightUrl))
    this.kitWithLocalWallet = newKitFromWeb3(new Web3(validatorUrl))
    this.kitWithLocalWalletLight = newKitFromWeb3(new Web3(lightUrl))
    this.web3 = new Web3(validatorUrl)
    this.web3Light = new Web3(lightUrl)
  }

  // before() does all the setup needed to then enable the individual test cases to be run
  async before() {
    await this.hooks.before()

    // Restart the validator node and start the light node to connect to it and sync up
    await this.hooks.restart()
    const lightNodeConfig = {
      name: 'light',
      validating: false,
      syncmode: 'light',
      port: 30305,
      rpcport: 8546,
    }
    await initAndSyncGethWithRetry(
      this.gethConfig,
      this.hooks.gethBinaryPath,
      lightNodeConfig,
      [...this.gethConfig.instances, lightNodeConfig],
      verbose,
      3
    )

    this.stableTokenAddr = (await this.kit.contracts.getStableToken()).address
    const gasPriceMinimum = await (await this.kit.contracts.getGasPriceMinimum()).gasPriceMinimum()
    this.gasPrice = gasPriceMinimum.times(5).toString()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)

    // Make sure we can use the validator's address to send transactions
    // For signing on the node, unlock the account (and add it first if it's the light node)
    await this.kit.connection.web3.eth.personal.unlockAccount(validatorAddress, '', 1000)
    await this.kitLight.connection.web3.eth.personal.importRawKey(validatorPrivateKey, '')
    await this.kitLight.connection.web3.eth.personal.unlockAccount(validatorAddress, '', 1000)
    // For the local wallets, add the private key.
    // The web3 instances don't need that, because we use a function that takes in the private key.
    this.kitWithLocalWallet.connection.addAccount(validatorPrivateKey)
    this.kitWithLocalWalletLight.connection.addAccount(validatorPrivateKey)
  }

  async generateUnprotectedTransaction(ethCompatible: boolean): Promise<string> {
    const encode = ejsRlp.encode
    const numToHex = (x: number | BigNumber) => ejsUtil.bufferToHex(ejsUtil.toBuffer(Number(x)))
    const nonce = await this.kit.connection.nonce(validatorAddress)
    const celoOnlyFields = ethCompatible ? [] : ['0x', '0x', '0x']
    const arr = [
      nonce > 0 ? numToHex(nonce) : '0x',
      numToHex(parseInt(this.gasPrice, 10)),
      numToHex(1000000), // plenty of gas
      ...celoOnlyFields,
      toAddress, // to
      '0x05', // value: 5 wei
      '0x', // no data
    ]
    // Creates SHA-3 hash of the RLP encoded version of the input.
    const signingHash = ejsUtil.toBuffer(keccak256(ejsRlp.encode(arr)))
    const pk = ejsUtil.addHexPrefix(validatorPrivateKey)
    const sig = ejsUtil.ecsign(signingHash, ejsUtil.toBuffer(pk))
    arr.push(
      ejsUtil.bufferToHex(stripZeros(sig.v) as Buffer),
      ejsUtil.bufferToHex(stripZeros(sig.r) as Buffer),
      ejsUtil.bufferToHex(stripZeros(sig.s) as Buffer)
    )
    return ensure0x(toHex(encode(arr)))
  }

  runReplayProtectionTests() {
    for (const ethCompatible of [false, true]) {
      this.runReplayProtectionTest(ethCompatible)
    }
  }

  runReplayProtectionTest(ethCompatible: boolean) {
    describe(`Transaction without replay protection, ethCompatible: ${ethCompatible}`, () => {
      let minedTx: any = null // Use any because we haven't added `ethCompatible` to these types
      let error: string | null = null

      before(async () => {
        const tx = await this.generateUnprotectedTransaction(ethCompatible)
        try {
          const receipt = await (await this.kit.connection.sendSignedTransaction(tx)).waitReceipt()
          minedTx = await this.kit.web3.eth.getTransaction(receipt.transactionHash)
          error = null
        } catch (err: any) {
          error = err.message
        }
      })
      if (ethCompatible && !this.cipIsActivated) {
        it('fails due to being ethereum-compatible', () => {
          assert.isNull(minedTx, 'Transaction succeeded when it should have failed')
          assert.equal(error, notYetActivatedError)
        })
      } else if (this.cipIsActivated) {
        if (this.replayProtectionIsNotMandatory) {
          // Should succeed, since replay protection is optional after Espresso
          it('succeeds', () => {
            assert.isNull(error, 'Transaction failed when it should have succeeded')
          })
        } else {
          // Replay protection is mandatory, so the transaction should fail
          it('fails due to replay protection being mandatory', () => {
            assert.isNull(minedTx, 'Transaction succeeded when it should have failed')
            assert.equal(error, noReplayProtectionError)
          })
        }
      } else {
        // Should succeed, since replay protection is optional before Donut
        it('succeeds', () => {
          assert.isNull(error, 'Transaction failed when it should have succeeded')
          assert.isFalse(minedTx.ethCompatible, 'Transaction has wrong ethCompatible value')
        })
      }
    })
  }

  runTestCase(testCase: TestCase) {
    // Generate a human-readable summary of the test case
    const options: string[] = []
    lodash.forEach(testCase, (value, key) => {
      if (value === true) {
        options.push(key)
      }
    })
    describe(`Testcase with: ${options.join(', ')}`, () => {
      let minedTx: any // Use any because we haven't added `ethCompatible` to these types
      let error: string | null = null

      before(async () => {
        const tx: CeloTx = {
          from: validatorAddress,
          gas: 1000000, // plenty for both types of transaction
          gasPrice: this.gasPrice,
          chainId: this.gethConfig.networkId,
          nonce: await this.kit.connection.nonce(validatorAddress),
        }
        if (testCase.useFeeCurrency) {
          tx.feeCurrency = this.stableTokenAddr
        }
        if (testCase.useGatewayFee) {
          tx.gatewayFee = '0x25'
        }
        if (testCase.useGatewayFeeRecipient) {
          tx.gatewayFeeRecipient = gatewayFeeRecipientAddress
        }

        if (testCase.contractCreation) {
          tx.data = bytecode
        } else {
          tx.to = toAddress
          tx.value = 5
        }

        try {
          let txHash: string
          // Use the right contractkit/web3 instances according to whether the testcase say to send
          // the transaction through the validator or the light client
          const k = testCase.lightNode ? this.kitLight : this.kit
          const kLocal = testCase.lightNode ? this.kitWithLocalWalletLight : this.kitWithLocalWallet
          const w3 = testCase.lightNode ? this.web3Light : this.web3

          if (testCase.sendRawTransaction) {
            // Sign the transaction locally and send using `eth_sendRawTransaction`
            let raw: string
            if (testCase.ethCompatible) {
              const signed = await w3.eth.accounts.signTransaction(tx, validatorPrivateKey)
              raw = signed.rawTransaction!
            } else {
              const signed = await kLocal.connection.wallet.signTransaction(tx)
              raw = signed.raw
            }
            // Once the transaction is signed and encoded, it doesn't matter whether we send it with web3 or contractkit
            txHash = (await w3.eth.sendSignedTransaction(raw)).transactionHash
          } else {
            tx.chainId = undefined //  clear the chainId b/c web3js won't format it as a hex bignum...
            // Send using `eth_sendTransaction`
            const params: any = tx // haven't added `ethCompatible` to the tx type
            // Only include ethCompatible if it's true.  This confirms that omitting it results to normal Celo
            // transactions, but doesn't test that ethCompatible: false also does.  But we will see in the resulting
            // transaction object (from eth_getTransaction) that it has ethCompatible: false.
            if (testCase.ethCompatible) {
              params.ethCompatible = true
            }
            const res = await k.sendTransaction(params)
            txHash = (await res.waitReceipt()).transactionHash
          }

          minedTx = await k.web3.eth.getTransaction(txHash)
          error = null
        } catch (err: any) {
          error = err.message
        }
      })

      // Verify that sending the transaction either worked or failed as expected for this test case
      if (testCase.errorString !== null) {
        it(`fails with the expected error (${testCase.errorReason})`, () => {
          assert.notEqual(error, null, "Expected an error but didn't get one")
          assert.match(
            error,
            new RegExp(testCase.errorString, 'i'),
            `Got "${error}", expected "${testCase.errorString}"`
          )
        })
      } else {
        it('succeeds', () => {
          assert.equal(error, null, 'Got an error but expected the transaction to succeed')
        })
        it(`ethCompatible is ${testCase.ethCompatible}`, () => {
          assert.equal(minedTx.ethCompatible, testCase.ethCompatible)
        })
      }
    })
  }
}

describe('CIP-35 >', function (this: any) {
  this.timeout(0)

  describe('before activation', () => {
    if (devFilter.cipIsActivated === true) {
      return
    }
    const testEnv = new TestEnv(false, false) // not donut, not espresso
    before(async function (this) {
      this.timeout(0)
      await testEnv.before()
    })

    if (replayProtectionTests !== 'only') {
      for (const testCase of testEnv.testCases) {
        testEnv.runTestCase(testCase)
      }
    }

    if (replayProtectionTests !== 'skip') {
      testEnv.runReplayProtectionTests()
    }

    after(async function (this: any) {
      this.timeout(0)
      await testEnv.hooks.after()
    })
  })

  describe('after activation', () => {
    if (devFilter.cipIsActivated === false) {
      return
    }
    const testEnv = new TestEnv(true, false) // donut, not espresso
    before(async function (this) {
      this.timeout(0)
      await testEnv.before()
    })

    if (replayProtectionTests !== 'only') {
      for (const testCase of testEnv.testCases) {
        testEnv.runTestCase(testCase)
      }
    }

    if (replayProtectionTests !== 'skip') {
      testEnv.runReplayProtectionTests()
    }

    after(async function (this: any) {
      this.timeout(0)
      await testEnv.hooks.after()
    })
  })

  describe('after cip50 (optional replay protection)', () => {
    if (devFilter.cipIsActivated === false) {
      return
    }
    const testEnv = new TestEnv(true, true) // donut and espresso
    before(async function (this) {
      this.timeout(0)
      await testEnv.before()
    })

    if (replayProtectionTests !== 'only') {
      for (const testCase of testEnv.testCases) {
        testEnv.runTestCase(testCase)
      }
    }

    if (replayProtectionTests !== 'skip') {
      testEnv.runReplayProtectionTests()
    }

    after(async function (this: any) {
      this.timeout(0)
      await testEnv.hooks.after()
    })
  })
})
