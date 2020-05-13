// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3-celo.d.ts" />

import { CeloContract, CeloToken, ContractKit, newKit, newKitFromWeb3 } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { toFixed } from '@celo/utils/lib/fixidity'
import { eqAddress } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { TransactionReceipt } from 'web3-core'
import { GethInstanceConfig } from '../lib/interfaces/geth-instance-config'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, initAndSyncGethWithRetry, killInstance, sleep } from './utils'

const TMP_PATH = '/tmp/e2e'
const verbose = false

/**
 * Helper Class to change StableToken Inflation in tests
 */
class InflationManager {
  private kit: ContractKit
  private readonly minUpdateDelay = 10

  constructor(readonly validatorUri: string, readonly validatorAddress: string) {
    this.kit = newKit(validatorUri)
    this.kit.defaultAccount = validatorAddress
  }

  now = async (): Promise<number> => {
    return Number((await this.kit.web3.eth.getBlock('pending')).timestamp)
  }

  getNextUpdateRate = async (): Promise<number> => {
    const stableToken = await this.kit.contracts.getStableToken()
    // Compute necessary `updateRate` so inflationFactor adjusment takes place on next operation
    const { factorLastUpdated } = await stableToken.getInflationParameters()

    // Wait until the minimum update delay has passed so we can set a rate that gives us some
    // buffer time to make the transaction in the next availiable update window.
    let timeSinceLastUpdated = (await this.now()) - factorLastUpdated.toNumber()
    while (timeSinceLastUpdated < this.minUpdateDelay) {
      await sleep(this.minUpdateDelay - timeSinceLastUpdated)
      timeSinceLastUpdated = (await this.now()) - factorLastUpdated.toNumber()
    }

    return timeSinceLastUpdated
  }

  getParameters = async () => {
    const stableToken = await this.kit.contracts.getStableToken()
    return stableToken.getInflationParameters()
  }

  setInflationRateForNextTransfer = async (rate: BigNumber) => {
    // Possibly update the inflation factor and ensure it won't update again.
    await this.setInflationParameters(new BigNumber(1), Number.MAX_SAFE_INTEGER)

    const updateRate = await this.getNextUpdateRate()
    await this.setInflationParameters(rate, updateRate)
  }

  setInflationParameters = async (rate: BigNumber, updatePeriod: number) => {
    const stableToken = await this.kit.contracts.getStableToken()
    await stableToken
      .setInflationParameters(toFixed(rate).toFixed(), updatePeriod)
      .sendAndWaitForReceipt({ from: this.validatorAddress })
  }
}

const freeze = async (validatorUri: string, validatorAddress: string, token: CeloToken) => {
  const kit = newKit(validatorUri)
  const tokenAddress = await kit.registry.addressFor(token)
  const freezer = await kit.contracts.getFreezer()
  await freezer.freeze(tokenAddress).sendAndWaitForReceipt({ from: validatorAddress })
}

const unfreeze = async (validatorUri: string, validatorAddress: string, token: CeloToken) => {
  const kit = newKit(validatorUri)
  const tokenAddress = await kit.registry.addressFor(token)
  const freezer = await kit.contracts.getFreezer()
  await freezer.unfreeze(tokenAddress).sendAndWaitForReceipt({ from: validatorAddress })
}

const whitelistAddress = async (
  validatorUri: string,
  validatorAddress: string,
  address: string
) => {
  const kit = newKit(validatorUri)
  const whitelistContract = await kit._web3Contracts.getTransferWhitelist()
  await whitelistContract.methods.whitelistAddress(address).send({ from: validatorAddress })
}

const setAddressWhitelist = async (
  validatorUri: string,
  validatorAddress: string,
  whitelist: string[]
) => {
  const kit = newKit(validatorUri)
  const whitelistContract = await kit._web3Contracts.getTransferWhitelist()
  await whitelistContract.methods
    .setDirectlyWhitelistedAddresses(whitelist)
    .send({ from: validatorAddress, gas: 500000 })
}

const setIntrinsicGas = async (validatorUri: string, validatorAddress: string, gasCost: number) => {
  const kit = newKit(validatorUri)
  const parameters = await kit.contracts.getBlockchainParameters()
  await parameters
    .setIntrinsicGasForAlternativeFeeCurrency(gasCost.toString())
    .sendAndWaitForReceipt({ from: validatorAddress })
}

// Intrinsic gas for a basic transaction
const INTRINSIC_TX_GAS_COST = 21000

// Additional intrinsic gas for a transaction with fee currency specified
const ADDITIONAL_INTRINSIC_TX_GAS_COST = 50000

// Gas refund for resetting to the original non-zero value
const sstoreCleanRefundEIP2200 = 4200
// Transfer cost of a stable token transfer, accounting for the refund above.
const stableTokenTransferGasCost = 23631

/** Helper to watch balance changes over accounts */
interface BalanceWatcher {
  update(): Promise<void>

  delta(address: string, token: CeloToken): BigNumber

  current(address: string, token: CeloToken): BigNumber

  initial(address: string, token: CeloToken): BigNumber

  debugPrint(address: string, token: CeloToken): void
}

async function newBalanceWatcher(kit: ContractKit, accounts: string[]): Promise<BalanceWatcher> {
  const stableToken = await kit.contracts.getStableToken()
  const goldToken = await kit.contracts.getGoldToken()

  async function fetch() {
    const balances: Record<
      string,
      { [CeloContract.GoldToken]: BigNumber; [CeloContract.StableToken]: BigNumber }
    > = {}
    await Promise.all(
      accounts.map(async (a) => {
        balances[a] = {
          [CeloContract.GoldToken]: await goldToken.balanceOf(a),
          [CeloContract.StableToken]: await stableToken.balanceOf(a),
        }
      })
    )
    return balances
  }

  const initial = await fetch()
  let current = initial
  return {
    async update() {
      current = await fetch()
    },
    delta(address: string, token: CeloToken) {
      return current[address][token].minus(initial[address][token])
    },
    current(address: string, token: CeloToken) {
      return current[address][token]
    },
    initial(address: string, token: CeloToken) {
      return initial[address][token]
    },
    debugPrint(address: string, token: CeloToken) {
      // tslint:disable-next-line: no-console
      console.log({
        initial: initial[address][token].toString(),
        current: current[address][token].toString(),
        delta: current[address][token].minus(initial[address][token]).toString(),
      })
    },
  }
}

function assertEqualBN(value: BigNumber, expected: BigNumber) {
  assert.equal(value.toString(), expected.toString())
}

describe('Transfer tests', function(this: any) {
  this.timeout(0)

  let kit: ContractKit
  const TransferAmount: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  let currentGethInstance: GethInstanceConfig
  const expectedProposerBlockReward: string = new BigNumber(
    Web3.utils.toWei('1', 'ether')
  ).toString()

  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const FromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631'

  // Arbitrary addresses.
  const governanceAddress = '0x00000000000000000000000000000000DeaDBeef'
  const ToAddress = '0xbBae99F0E1EE565404465638d40827b54D343638'
  const FeeRecipientAddress = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'

  const syncModes = ['full', 'fast', 'light', 'lightest']
  const gethConfig: GethRunConfig = {
    migrateTo: 20,
    networkId: 1101,
    network: 'local',
    runPath: TMP_PATH,
    instances: [
      {
        name: 'validator',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      },
    ],
  }

  const hooks = getHooks(gethConfig)

  before(async function(this: any) {
    this.timeout(0)
    await hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await hooks.after()
  })

  // Spin up a node that we can sync with.
  const fullInstance: GethInstanceConfig = {
    name: 'txFull',
    validating: false,
    syncmode: 'full',
    lightserv: true,
    gatewayFee: new BigNumber(10000),
    port: 30305,
    rpcport: 8547,
    // We need to set an etherbase here so that the full node will accept transactions from
    // light clients.
    etherbase: FeeRecipientAddress,
  }

  const restartWithCleanNodes = async () => {
    await hooks.restart()

    kit = newKitFromWeb3(new Web3('http://localhost:8545'))
    kit.gasInflationFactor = 1

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)

    await initAndSyncGethWithRetry(
      gethConfig,
      hooks.gethBinaryPath,
      fullInstance,
      [...gethConfig.instances, fullInstance],
      verbose,
      3
    )

    // Install an arbitrary address as the goverance address to act as the infrastructure fund.
    // This is chosen instead of full migration for speed and to avoid the need for a governance
    // proposal, as all contracts are owned by governance once the migration is complete.
    const registry = await kit._web3Contracts.getRegistry()
    const tx = registry.methods.setAddressFor(CeloContract.Governance, governanceAddress)
    const gas = await tx.estimateGas({ from: validatorAddress })
    await tx.send({ from: validatorAddress, gas })

    // Give the account we will send transfers as sufficient gold and dollars.
    const startBalance = TransferAmount.times(500)
    const resDollars = await transferCeloDollars(validatorAddress, FromAddress, startBalance)
    const resGold = await transferCeloGold(validatorAddress, FromAddress, startBalance)
    await Promise.all([resDollars.waitReceipt(), resGold.waitReceipt()])
  }

  const startSyncNode = async (syncmode: string) => {
    if (currentGethInstance != null) {
      await killInstance(currentGethInstance)
    }

    const light = syncmode === 'light' || syncmode === 'lightest'
    currentGethInstance = {
      name: syncmode,
      validating: false,
      syncmode,
      port: 30307,
      rpcport: 8549,
      lightserv: !light,
      // TODO(nategraf): Remove this when light clients can query for gateway fee.
      gatewayFee: light ? new BigNumber(10000) : undefined,
      privateKey: DEF_FROM_PK,
    }

    // Spin up the node to run transfers as.
    await initAndSyncGethWithRetry(
      gethConfig,
      hooks.gethBinaryPath,
      currentGethInstance,
      [fullInstance, currentGethInstance],
      verbose,
      3
    )

    // Reset contracts to send RPCs through transferring node.
    kit.web3.setProvider(new Web3.providers.HttpProvider('http://localhost:8549'))

    // Give the node time to sync the latest block.
    const upstream = await new Web3('http://localhost:8545').eth.getBlock('latest')
    while ((await kit.web3.eth.getBlock('latest')).number < upstream.number) {
      await sleep(0.5)
    }

    // Unlock Node account
    await kit.web3.eth.personal.unlockAccount(FromAddress, '', 1000000)
  }

  const transferCeloGold = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: {
      gas?: number
      gasPrice?: string
      feeCurrency?: string
      gatewayFeeRecipient?: string
      gatewayFee?: string
    } = {}
  ) => {
    const res = await kit.sendTransaction({
      from: fromAddress,
      to: toAddress,
      value: amount.toString(),
      ...txOptions,
    })
    return res
  }

  const transferCeloDollars = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: {
      gas?: number
      gasPrice?: string
      feeCurrency?: string
      gatewayFeeRecipient?: string
      gatewayFee?: string
    } = {}
  ) => {
    const kitStableToken = await kit.contracts.getStableToken()
    const res = await kitStableToken.transfer(toAddress, amount.toString()).send({
      from: fromAddress,
      ...txOptions,
    })

    return res
  }

  const getGasPriceMinimum = async (feeCurrency: string | undefined) => {
    const gasPriceMinimum = await kit._web3Contracts.getGasPriceMinimum()
    if (feeCurrency) {
      return gasPriceMinimum.methods.getGasPriceMinimum(feeCurrency).call()
    } else {
      return gasPriceMinimum.methods.gasPriceMinimum().call()
    }
  }

  interface Fees {
    total: BigNumber
    tip: BigNumber
    base: BigNumber
    gateway: BigNumber
  }

  interface GasUsage {
    used?: number
    expected: number
  }

  interface TestTxResults {
    ok: boolean
    fees: Fees
    gas: GasUsage
    events: any[]
  }

  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

  function truncateTopic(hex: string) {
    return '0x' + hex.substr(26)
  }

  function parseEvents(receipt: TransactionReceipt | undefined) {
    if (!receipt) {
      return []
    }
    if (receipt.events && receipt.events.Transfer) {
      let events: any = receipt.events.Transfer
      if (!(events instanceof Array)) {
        events = [events]
      }
      return events.map((a: any) => ({ to: a.returnValues.to, from: a.returnValues.from }))
    }
    if (receipt.logs) {
      return receipt.logs
        .filter((a) => a.topics[0] === TRANSFER_TOPIC)
        .map((a) => ({ to: truncateTopic(a.topics[2]), from: truncateTopic(a.topics[1]) }))
    }
  }

  const runTestTransaction = async (
    txResult: TransactionResult,
    expectedGasUsed: number,
    feeCurrency?: string
  ): Promise<TestTxResults> => {
    const minGasPrice = await getGasPriceMinimum(feeCurrency)
    assert.isAbove(parseInt(minGasPrice, 10), 0)

    let ok = false
    let receipt: TransactionReceipt | undefined
    try {
      receipt = await txResult.waitReceipt()
      ok = true
    } catch (err) {
      ok = false
    }

    const events = parseEvents(receipt)

    if (receipt != null && receipt.gasUsed !== expectedGasUsed) {
      // tslint:disable-next-line: no-console
      console.log('OOPSS: Different Gas', receipt.gasUsed, expectedGasUsed)
    }

    const gasVal = receipt ? receipt.gasUsed : expectedGasUsed
    assert.isAbove(gasVal, 0)
    const txHash = await txResult.getHash()
    const tx = await kit.web3.eth.getTransaction(txHash)
    assert.isAbove(parseInt(tx.gasPrice, 10), 0)
    const txFee = new BigNumber(gasVal).times(tx.gasPrice)
    const txFeeBase = new BigNumber(gasVal).times(minGasPrice)
    const txFeeTip = txFee.minus(txFeeBase)
    const gatewayFee = new BigNumber(tx.gatewayFee || 0)
    assert.equal(tx.gatewayFeeRecipient === null, gatewayFee.eq(0))

    const fees: Fees = {
      total: txFee.plus(gatewayFee),
      base: txFeeBase,
      tip: txFeeTip,
      gateway: gatewayFee,
    }
    const gas: GasUsage = {
      used: receipt && receipt.gasUsed,
      expected: expectedGasUsed,
    }
    return { ok, fees, gas, events }
  }

  function testTxPoolFiltering({
    feeToken,
    gas,
    expectedError,
  }: {
    feeToken: CeloToken
    gas: number
    expectedError: string
  }) {
    it('should not add the transaction to the pool', async () => {
      const feeCurrency =
        feeToken === CeloContract.StableToken
          ? await kit.registry.addressFor(CeloContract.StableToken)
          : undefined
      try {
        const res = await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
          gas,
          feeCurrency,
        })
        await res.waitReceipt()
        assert.fail('no error was thrown')
      } catch (error) {
        assert.include(error.toString(), expectedError)
      }
    })
  }

  function testTransferToken({
    transferToken,
    feeToken,
    expectedGas,
    txOptions,
    expectSuccess = true,
    fromAddress = FromAddress,
    toAddress = ToAddress,
  }: {
    transferToken: CeloToken
    feeToken: CeloToken
    expectedGas: number
    expectSuccess?: boolean
    txOptions?: {
      gas?: number
      gatewayFeeRecipient?: string
      gatewayFee?: string
    }
    fromAddress?: string
    toAddress?: string
  }) {
    let txRes: TestTxResults
    let balances: BalanceWatcher

    before(async () => {
      const feeCurrency =
        feeToken === CeloContract.StableToken
          ? await kit.registry.addressFor(CeloContract.StableToken)
          : undefined

      const accounts = [
        fromAddress,
        toAddress,
        validatorAddress,
        FeeRecipientAddress,
        governanceAddress,
      ]
      balances = await newBalanceWatcher(kit, accounts)

      const transferFn =
        transferToken === CeloContract.StableToken ? transferCeloDollars : transferCeloGold
      const txResult = await transferFn(fromAddress, toAddress, TransferAmount, {
        ...txOptions,
        feeCurrency,
      })

      // Writing to an empty storage location (e.g. an uninitialized ERC20 account) costs 15k extra gas.
      if (
        transferToken === CeloContract.StableToken &&
        balances.initial(toAddress, transferToken).eq(0)
      ) {
        expectedGas += 15000
      }

      txRes = await runTestTransaction(txResult, expectedGas, feeCurrency)

      await balances.update()
    })

    if (expectSuccess) {
      it(`should succeed`, () => assert.isTrue(txRes.ok))

      it(`should use the expected amount of gas`, () =>
        assert.equal(txRes.gas.used, txRes.gas.expected))

      it(`should increment the receiver's ${transferToken} balance by the transfer amount`, () =>
        assertEqualBN(balances.delta(toAddress, transferToken), TransferAmount))

      if (feeToken === CeloContract.StableToken) {
        it('should have emitted transfer events for the fee token', () => {
          assert(
            txRes.events.find(
              (a) => eqAddress(a.to, governanceAddress) && eqAddress(a.from, fromAddress)
            )
          )
        })
      }

      if (transferToken === feeToken) {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount plus fees`, () => {
          const expectedBalanceChange = txRes.fees.total.plus(TransferAmount)
          assertEqualBN(balances.delta(fromAddress, transferToken).negated(), expectedBalanceChange)
        })
      } else {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount`, () =>
          assertEqualBN(balances.delta(fromAddress, transferToken).negated(), TransferAmount))

        it(`should decrement the sender's ${feeToken} balance by the total fees`, () =>
          assertEqualBN(balances.delta(fromAddress, feeToken).negated(), txRes.fees.total))
      }
    } else {
      it(`should fail`, () => assert.isFalse(txRes.ok))

      it(`should decrement the sender's ${feeToken} balance by the total fees`, () =>
        assertEqualBN(balances.delta(fromAddress, feeToken).negated(), txRes.fees.total))

      it(`should not change the receiver's ${transferToken} balance`, () => {
        assertEqualBN(
          balances.initial(toAddress, transferToken),
          balances.current(toAddress, transferToken)
        )
      })

      if (transferToken !== feeToken) {
        it(`should not change the sender's ${transferToken} balance`, () => {
          assertEqualBN(
            balances.initial(fromAddress, transferToken),
            balances.current(fromAddress, transferToken)
          )
        })
      }
    }

    it(`should increment the gateway fee recipient's ${feeToken} balance by the gateway fee`, () =>
      assertEqualBN(balances.delta(FeeRecipientAddress, feeToken), txRes.fees.gateway))

    it(`should increment the infrastructure fund's ${feeToken} balance by the base portion of the gas fee`, () =>
      assertEqualBN(balances.delta(governanceAddress, feeToken), txRes.fees.base))

    it(`should increment the proposers's ${feeToken} balance by the rest of the gas fee`, () => {
      assertEqualBN(
        balances.delta(validatorAddress, feeToken).mod(expectedProposerBlockReward),
        txRes.fees.tip
      )
    })
  }

  describe('Normal Transfer >', () => {
    before(restartWithCleanNodes)

    for (const syncMode of syncModes) {
      describe(`${syncMode} Node >`, () => {
        before(`start geth on sync: ${syncMode}`, () => startSyncNode(syncMode))

        describe('Transfer CeloGold >', () => {
          describe('with feeCurrency = CeloGold >', () => {
            if (syncMode === 'light' || syncMode === 'lightest') {
              describe('when running in light/lightest sync mode', () => {
                const recipient = (choice: string) => {
                  switch (choice) {
                    case 'peer':
                      return FeeRecipientAddress
                    case 'random':
                      return Web3.utils.randomHex(20)
                    default:
                      // unset
                      return undefined
                  }
                }
                const feeValue = (choice: string) => {
                  switch (choice) {
                    case 'sufficient':
                      return '0x10000'
                    case 'insufficient':
                      return '0x1'
                    default:
                      // unset
                      return undefined
                  }
                }
                for (const recipientChoice of ['peer', 'random', 'unset']) {
                  describe(`when the gateway fee recipient is ${recipientChoice}`, () => {
                    for (const feeValueChoice of ['sufficient', 'insufficient', 'unset']) {
                      describe(`when the gateway fee value is ${feeValueChoice}`, () => {
                        const txOptions = {
                          gatewayFeeRecipient: recipient(recipientChoice),
                          gatewayFee: feeValue(feeValueChoice),
                        }
                        if (recipientChoice === 'random' || feeValueChoice === 'insufficient') {
                          const errMsg =
                            recipientChoice === 'random'
                              ? 'no peer with etherbase found'
                              : 'gateway fee too low to broadcast to peers'
                          it('should get rejected by the sending node before being added to the tx pool', async () => {
                            try {
                              const res = await transferCeloGold(
                                FromAddress,
                                ToAddress,
                                TransferAmount,
                                txOptions
                              )
                              await res.waitReceipt()
                              assert.fail('no error was thrown')
                            } catch (error) {
                              assert.include(error.toString(), `Returned error: ${errMsg}`)
                            }
                          })
                        } else {
                          testTransferToken({
                            expectedGas: INTRINSIC_TX_GAS_COST,
                            transferToken: CeloContract.GoldToken,
                            feeToken: CeloContract.GoldToken,
                            txOptions,
                          })
                        }
                      })
                    }
                  })
                }
              })
            } else {
              testTransferToken({
                expectedGas: INTRINSIC_TX_GAS_COST,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.GoldToken,
              })
            }
          })

          describe('feeCurrency = CeloDollars >', () => {
            const intrinsicGas = INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST

            describe('when there is no demurrage', () => {
              describe('when setting a gas amount greater than the amount of gas necessary', () =>
                testTransferToken({
                  expectedGas: intrinsicGas,
                  transferToken: CeloContract.GoldToken,
                  feeToken: CeloContract.StableToken,
                }))

              describe('when setting a gas amount less than the intrinsic gas amount', () => {
                it('should not add the transaction to the pool', async () => {
                  const gas = intrinsicGas - 1
                  const feeCurrency = await kit.registry.addressFor(CeloContract.StableToken)
                  try {
                    const res = await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                      gas,
                      feeCurrency,
                    })
                    await res.getHash()
                    assert.fail('no error was thrown')
                  } catch (error) {
                    assert.include(error.toString(), 'Returned error: intrinsic gas too low')
                  }
                })
              })
            })
          })
        })

        describe('Transfer CeloDollars', () => {
          describe('feeCurrency = CeloDollars >', () => {
            testTransferToken({
              expectedGas:
                stableTokenTransferGasCost +
                INTRINSIC_TX_GAS_COST +
                ADDITIONAL_INTRINSIC_TX_GAS_COST,
              transferToken: CeloContract.StableToken,
              feeToken: CeloContract.StableToken,
            })
          })

          describe('feeCurrency = CeloGold >', () => {
            testTransferToken({
              expectedGas:
                stableTokenTransferGasCost + INTRINSIC_TX_GAS_COST + sstoreCleanRefundEIP2200,
              transferToken: CeloContract.StableToken,
              feeToken: CeloContract.GoldToken,
            })
          })
        })
      })
    }
  })

  describe('Transfer with changed intrinsic gas cost >', () => {
    const changedIntrinsicGasForAlternativeFeeCurrency = 34000

    before(restartWithCleanNodes)

    for (const syncMode of syncModes) {
      describe(`${syncMode} Node >`, () => {
        before(`start geth on sync: ${syncMode}`, async () => {
          try {
            await startSyncNode(syncMode)
            await setIntrinsicGas(
              'http://localhost:8545',
              validatorAddress,
              changedIntrinsicGasForAlternativeFeeCurrency
            )
          } catch (err) {
            console.debug('some error', err)
          }
        })

        describe('Transfer CeloGold >', () => {
          describe('feeCurrency = CeloDollars >', () => {
            const intrinsicGas =
              changedIntrinsicGasForAlternativeFeeCurrency + INTRINSIC_TX_GAS_COST
            describe('when there is no demurrage', () => {
              describe('when setting a gas amount greater than the amount of gas necessary', () =>
                testTransferToken({
                  expectedGas: intrinsicGas,
                  transferToken: CeloContract.GoldToken,
                  feeToken: CeloContract.StableToken,
                }))

              describe('when setting a gas amount less than the intrinsic gas amount', () => {
                testTxPoolFiltering({
                  gas: intrinsicGas - 1,
                  feeToken: CeloContract.StableToken,
                  expectedError: 'Returned error: intrinsic gas too low',
                })
              })
            })
          })
        })

        describe('Transfer CeloDollars', () => {
          describe('feeCurrency = CeloDollars >', () => {
            testTransferToken({
              expectedGas:
                stableTokenTransferGasCost +
                changedIntrinsicGasForAlternativeFeeCurrency +
                INTRINSIC_TX_GAS_COST,
              transferToken: CeloContract.StableToken,
              feeToken: CeloContract.StableToken,
            })
          })
        })
      })
    }
  })

  describe('Transfer with Demurrage >', () => {
    for (const syncMode of syncModes) {
      describe(`${syncMode} Node >`, () => {
        let inflationManager: InflationManager
        before(`start geth on sync: ${syncMode}`, async () => {
          await restartWithCleanNodes()
          inflationManager = new InflationManager('http://localhost:8545', validatorAddress)
          await startSyncNode(syncMode)
        })

        describe('when there is demurrage of 50% applied', () => {
          describe('when setting a gas amount greater than the amount of gas necessary', () => {
            let balances: BalanceWatcher
            let expectedFees: Fees
            let txRes: TestTxResults

            before(async () => {
              balances = await newBalanceWatcher(kit, [
                FromAddress,
                ToAddress,
                validatorAddress,
                FeeRecipientAddress,
                governanceAddress,
              ])

              await inflationManager.setInflationRateForNextTransfer(new BigNumber(2))
              const stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
              txRes = await runTestTransaction(
                await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                  feeCurrency: stableTokenAddress,
                }),
                INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST,
                stableTokenAddress
              )

              await balances.update()
              expectedFees = txRes.fees
            })

            it('should succeed', () => assert.isTrue(txRes.ok))

            it('should use the expected amount of gas', () =>
              assert.equal(txRes.gas.used, txRes.gas.expected))

            it("should decrement the sender's Celo Gold balance by the transfer amount", () => {
              assertEqualBN(
                balances.delta(FromAddress, CeloContract.GoldToken).negated(),
                TransferAmount
              )
            })

            it("should increment the receiver's Celo Gold balance by the transfer amount", () => {
              assertEqualBN(balances.delta(ToAddress, CeloContract.GoldToken), TransferAmount)
            })

            it("should halve the sender's Celo Dollar balance due to demurrage and decrement it by the total fees", () => {
              assertEqualBN(
                balances
                  .initial(FromAddress, CeloContract.StableToken)
                  .idiv(2)
                  .minus(balances.current(FromAddress, CeloContract.StableToken)),
                expectedFees.total
              )
            })

            it("should halve the gateway fee recipient's Celo Dollar balance then increase it by the gateway fee", () => {
              assertEqualBN(
                balances
                  .current(FeeRecipientAddress, CeloContract.StableToken)
                  .minus(balances.initial(FeeRecipientAddress, CeloContract.StableToken).idiv(2)),
                expectedFees.gateway
              )
            })

            it("should halve the infrastructure fund's Celo Dollar balance then increment it by the base portion of the gas fees", () => {
              assertEqualBN(
                balances
                  .current(governanceAddress, CeloContract.StableToken)
                  .minus(balances.initial(governanceAddress, CeloContract.StableToken).idiv(2)),
                expectedFees.base
              )
            })
          })
        })
      })
    }
  })

  describe('Transfers Frozen >', () => {
    before(restartWithCleanNodes)

    for (const syncMode of syncModes) {
      describe(`${syncMode} Node >`, () => {
        before(`start geth on sync: ${syncMode}`, () => startSyncNode(syncMode))

        describe('when CeloGold is frozen', () => {
          before('ensure gold transfers are frozen', async () => {
            await freeze('http://localhost:8545', validatorAddress, CeloContract.GoldToken)
          })

          describe('check if frozen', () => {
            it('should be frozen', async () => {
              const goldTokenAddress = await kit.registry.addressFor(CeloContract.GoldToken)
              const freezer = await kit.contracts.getFreezer()
              const isFrozen = await freezer.isFrozen(goldTokenAddress)
              assert(isFrozen)
            })
          })
          describe('when neither sender nor receiver is whitelisted', () => {
            before('ensure neither sender nor receiver is whitelisted', async () => {
              await setAddressWhitelist('http://localhost:8545', validatorAddress, [])
            })
            testTxPoolFiltering({
              gas: INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST,
              feeToken: CeloContract.StableToken,
              expectedError: 'Returned error: transfers are currently frozen',
            })
          })
          describe('when receiver is whitelisted', () => {
            it('should transfer succesfully', async () => {
              const whitelistedAddress = await kit.registry.addressFor(CeloContract.LockedGold)
              testTransferToken({
                expectedGas: INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.GoldToken,
                toAddress: whitelistedAddress,
              })
            })
          })
          describe('when sender is whitelisted', () => {
            before('add sender to transfer whitelist', async () => {
              await whitelistAddress('http://localhost:8545', validatorAddress, FromAddress)
            })
            it('should transfer succesfully', async () => {
              testTransferToken({
                expectedGas: INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.GoldToken,
              })
            })

            describe('when sender is removed again from whitelist', () => {
              before('remove sender from whitelist', async () => {
                await setAddressWhitelist('http://localhost:8545', validatorAddress, [])
              })
              testTxPoolFiltering({
                gas: INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST,
                feeToken: CeloContract.GoldToken,
                expectedError: 'Returned error: transfers are currently frozen',
              })
            })
          })

          describe('when gold transfers are unfrozen again', async () => {
            before('unfreeze gold transfers', async () => {
              await unfreeze('http://localhost:8545', validatorAddress, CeloContract.GoldToken)
            })
            it('should transfer normally', async () => {
              testTransferToken({
                expectedGas: INTRINSIC_TX_GAS_COST + ADDITIONAL_INTRINSIC_TX_GAS_COST,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.GoldToken,
              })
            })
          })
        })
      })
    }
  })
})
