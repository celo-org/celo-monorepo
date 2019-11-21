// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3.d.ts" />

import { CeloContract, CeloToken, ContractKit, newKit, newKitFromWeb3 } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { TransactionReceipt } from 'web3/types'
import {
  getEnode,
  GethInstanceConfig,
  getHooks,
  GethTestConfig,
  initAndStartGeth,
  killInstance,
  sleep,
} from './utils'

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
    return (await this.kit.web3.eth.getBlock('pending')).timestamp
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
      .setInflationParameters(toFixed(rate).toString(), updatePeriod)
      .sendAndWaitForReceipt({ from: this.validatorAddress })
  }
}

const setIntrinsicGas = async (validatorUri: string, validatorAddress: string, gasCost: number) => {
  const kit = newKit(validatorUri)
  const parameters = await kit.contracts.getBlockchainParameters()
  await parameters
    .setIntrinsicGasForAlternativeFeeCurrency(gasCost.toString())
    .sendAndWaitForReceipt({ from: validatorAddress })
}

// Intrinsic gas for a basic transaction
const INTRINSIC_GAS_FOR_TX = 21000

// Additional intrinsic gas for a transaction with fee currency specified
const ADDITIONAL_INTRINSIC_TX_GAS_COST = 166000

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

  const syncModes = ['full', 'fast', 'light', 'ultralight']
  const gethConfig: GethTestConfig = {
    migrateTo: 18,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  const hooks = getHooks(gethConfig)
  after(hooks.after)
  before(hooks.before)

  const restartWithCleanNodes = async () => {
    await hooks.restart()

    kit = newKitFromWeb3(new Web3('http://localhost:8545'))
    kit.gasInflationFactor = 1

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)

    // Spin up a node that we can sync with.
    const fullInstance = {
      name: 'txFull',
      validating: false,
      syncmode: 'full',
      lightserv: true,
      port: 30305,
      rpcport: 8547,
      // We need to set an etherbase here so that the full node will accept transactions from
      // light clients.
      etherbase: FeeRecipientAddress,
      peers: [await getEnode(8545)],
    }
    await initAndStartGeth(hooks.gethBinaryPath, fullInstance)

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
    // Spin up the node to run transfers as.
    currentGethInstance = await initAndStartGeth(hooks.gethBinaryPath, {
      name: syncmode,
      validating: false,
      syncmode,
      port: 30307,
      rpcport: 8549,
      privateKey: DEF_FROM_PK,
      peers: [await getEnode(8547)],
    })

    // Reset contracts to send RPCs through transferring node.
    kit.web3.currentProvider = new kit.web3.providers.HttpProvider('http://localhost:8549')

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
    return { ok, fees, gas }
  }

  function testTransferToken({
    transferToken,
    feeToken,
    expectedGas,
    txOptions,
    expectSuccess = true,
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
  }) {
    let txRes: TestTxResults
    let balances: BalanceWatcher

    before(async () => {
      const feeCurrency =
        feeToken === CeloContract.StableToken
          ? await kit.registry.addressFor(CeloContract.StableToken)
          : undefined

      const accounts = [
        FromAddress,
        ToAddress,
        validatorAddress,
        FeeRecipientAddress,
        governanceAddress,
      ]
      balances = await newBalanceWatcher(kit, accounts)

      const transferFn =
        transferToken === CeloContract.StableToken ? transferCeloDollars : transferCeloGold
      const txResult = await transferFn(FromAddress, ToAddress, TransferAmount, {
        ...txOptions,
        feeCurrency,
      })

      // Writing to an empty storage location (e.g. an uninitialized ERC20 account) costs 15k extra gas.
      if (
        transferToken === CeloContract.StableToken &&
        balances.initial(ToAddress, transferToken).eq(0)
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
        assertEqualBN(balances.delta(ToAddress, transferToken), TransferAmount))

      if (transferToken === feeToken) {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount plus fees`, () => {
          const expectedBalanceChange = txRes.fees.total.plus(TransferAmount)
          assertEqualBN(balances.delta(FromAddress, transferToken).negated(), expectedBalanceChange)
        })
      } else {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount`, () =>
          assertEqualBN(balances.delta(FromAddress, transferToken).negated(), TransferAmount))

        it(`should decrement the sender's ${feeToken} balance by the total fees`, () =>
          assertEqualBN(balances.delta(FromAddress, feeToken).negated(), txRes.fees.total))
      }
    } else {
      it(`should fail`, () => assert.isFalse(txRes.ok))

      it(`should decrement the sender's ${feeToken} balance by the total fees`, () =>
        assertEqualBN(balances.delta(FromAddress, feeToken).negated(), txRes.fees.total))

      it(`should not change the receiver's ${transferToken} balance`, () => {
        assertEqualBN(
          balances.initial(ToAddress, transferToken),
          balances.current(ToAddress, transferToken)
        )
      })

      if (transferToken !== feeToken) {
        it(`should not change the sender's ${transferToken} balance`, () => {
          assertEqualBN(
            balances.initial(FromAddress, transferToken),
            balances.current(FromAddress, transferToken)
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
          const GOLD_TRANSACTION_GAS_COST = 21000
          describe('with feeCurrency = CeloGold >', () => {
            if (syncMode === 'light' || syncMode === 'ultralight') {
              describe('when running in light/ultralight sync mode', () => {
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
                            expectedGas: GOLD_TRANSACTION_GAS_COST,
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
                expectedGas: GOLD_TRANSACTION_GAS_COST,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.GoldToken,
              })
            }
          })

          describe('feeCurrency = CeloDollars >', () => {
            const intrinsicGas = INTRINSIC_GAS_FOR_TX + ADDITIONAL_INTRINSIC_TX_GAS_COST

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
              expectedGas: 207303,
              transferToken: CeloContract.StableToken,
              feeToken: CeloContract.StableToken,
            })
          })

          describe('feeCurrency = CeloGold >', () => {
            testTransferToken({
              expectedGas: 41303,
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
            const intrinsicGas = changedIntrinsicGasForAlternativeFeeCurrency + INTRINSIC_GAS_FOR_TX
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
              expectedGas: 75303,
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
                187000,
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
})
