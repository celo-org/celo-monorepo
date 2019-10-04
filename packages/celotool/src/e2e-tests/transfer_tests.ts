import { CeloContract, CeloToken, ContractKit, newKit, newKitFromWeb3 } from '@celo/contractkit'
import { TransactionResult } from '@celo/contractkit/lib/utils/tx-result'
import { fromFixed, toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { TransactionReceipt } from 'web3/types'
import {
  getContractAddress,
  getEnode,
  GethInstanceConfig,
  getHooks,
  initAndStartGeth,
  killInstance,
  sleep,
} from './utils'

const registryAbi = [
  {
    constant: false,
    inputs: [
      {
        name: 'identifier',
        type: 'string',
      },
      {
        name: 'addr',
        type: 'address',
      },
    ],
    name: 'setAddressFor',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const nowSeconds = () => Math.floor(Date.now() / 1000)

function logReceiptEvents(receipt: TransactionReceipt) {
  if (receipt.events && receipt.events.InflationParametersUpdated) {
    console.log(
      'inflaction Parameters updated:',
      'rate',
      fromFixed(
        new BigNumber(receipt.events.InflationParametersUpdated.returnValues.rate)
      ).toString(),
      'updatePeriod',
      receipt.events.InflationParametersUpdated.returnValues.updatePeriod,
      'lastUpdated',
      receipt.events.InflationParametersUpdated.returnValues.lastUpdated
    )
  }
  if (receipt.events && receipt.events.InflationFactorUpdated) {
    console.log(
      'inflaction factor updated:',
      'factor',
      fromFixed(
        new BigNumber(receipt.events.InflationFactorUpdated.returnValues.factor)
      ).toString(),
      'lastUpdated',
      receipt.events.InflationFactorUpdated.returnValues.lastUpdated
    )
  }
}

class InflationManager {
  private kit: ContractKit
  constructor(readonly validatorUri: string, readonly validatorAddress: string) {
    this.kit = newKit(validatorUri)
    this.kit.defaultAccount = validatorAddress
  }

  getNextUpdateRate = async (): Promise<number> => {
    const stableToken = await this.kit.contracts.getStableToken()
    // Compute necessary `updateRate` so inflationFactor adjusment takes place on next operation
    const { factorLastUpdated } = await stableToken.getInflationParameters()
    const timeSinceLastUpdated = nowSeconds() - factorLastUpdated.toNumber()

    if (timeSinceLastUpdated < 10) {
      console.log('Waiting until some time pass to update inflation')
      await sleep(10 - timeSinceLastUpdated)
      return this.getNextUpdateRate()
    } else {
      return timeSinceLastUpdated
    }
  }

  getParameters = async () => {
    const stableToken = await this.kit.contracts.getStableToken()
    return stableToken.getInflationParameters()
  }

  changeInflationFactorOnNextTransfer = async (desiredFactor: BigNumber) => {
    const parameters = await this.getParameters()
    if (desiredFactor.eq(parameters.factor)) {
      return
    }

    // desiredFactor = factor * rate
    const nextRate = desiredFactor.div(parameters.factor)
    const updateRate = await this.getNextUpdateRate()
    await this.setInflationParameters(nextRate, updateRate)
  }

  setInflationParameters = async (rate: BigNumber, updatePeriod: number) => {
    const stableToken = await this.kit.contracts.getStableToken()
    const receipt = await stableToken
      .setInflationParameters(toFixed(rate).toString(), updatePeriod)
      .sendAndWaitForReceipt({ from: this.validatorAddress })

    console.log('setInflation')
    logReceiptEvents(receipt)

    // const mintReceipt = await stableToken
    //   .mint(validatorAddress, ONE.toString())
    //   .sendAndWaitForReceipt({ from: validatorAddress })

    // console.log('mint!')
    // logReceiptEvents(mintReceipt)
  }

  resetInflation = async () => {
    await this.changeInflationFactorOnNextTransfer(new BigNumber('1'))

    const ONE = new BigNumber('1')
    const ONE_WEEK = 7 * 24 * 60 * 60

    // Reset factor, and change updatePeriod so no new inflation is added
    await this.setInflationParameters(ONE, ONE_WEEK)

    const parametersPost = await this.getParameters()
    console.log('FACTOR', parametersPost.factor.toString())
    assertEqualBN(parametersPost.factor, ONE)
  }
}

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

interface Fees {
  total: BigNumber
  proposer: BigNumber
  recipient: BigNumber
}

function assertEqualBN(value: BigNumber, expected: BigNumber) {
  assert.equal(value.toString(), expected.toString())
}

describe('transfer tests', function(this: any) {
  this.timeout(0)

  let web3: Web3
  let kit: ContractKit
  const TransferAmount: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  let currentGethInstance: GethInstanceConfig
  // const expectedInfrastructureBlockReward: string = new BigNumber(
  //   Web3.utils.toWei('1', 'ether')
  // ).toString()

  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const FromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631'

  // Arbitrary addresses.
  const ToAddress = '0xbBae99F0E1EE565404465638d40827b54D343638'
  const FeeRecipientAddress = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'
  const GovernanceAddress = '0x1a748f924e5b346d68b2202e85ba6a2c72570b26'

  const inflationManager = new InflationManager('http://localhost:8545', validatorAddress)

  const gethConfig = {
    migrateTo: 8,
    migrateGovernance: false,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  const hooks = getHooks(gethConfig)

  after(hooks.after)
  before('start validator', async () => {
    await hooks.before()
    await hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    kit.gasInflactionFactor = 1
  })

  before('unlock validator account', async () => {
    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)
  })

  // We do not deploy the governance contract so that we can set inflation parameters on
  // StableToken. We instead, point the registry to a dummy address, so that we can test
  // transaction fees going to the infrastructure fund.
  before('set fake Governance', async () => {
    const registryAddress = await getContractAddress('RegistryProxy')
    const registry = new web3.eth.Contract(registryAbi, registryAddress)
    const tx = registry.methods.setAddressFor('Governance', GovernanceAddress)
    const gas = await tx.estimateGas()
    await tx.send({ gas, from: validatorAddress })
  })

  // Give the account we will send transfers as sufficient gold and dollars.
  before('fund FROM account', async () => {
    const startBalance = TransferAmount.times(500)
    const resDollars = await transferCeloDollars(validatorAddress, FromAddress, startBalance)
    const resGold = await transferCeloGold(validatorAddress, FromAddress, startBalance)
    await Promise.all([resDollars.waitReceipt(), resGold.waitReceipt()])
  })

  // Spin up a node that we can sync with.
  before('run txNode', async () => {
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
  })

  const restartGeth = async (syncmode: string) => {
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

    // TODO(asa): Reduce this to speed tests up.
    // Give the node time to sync the latest block.
    await sleep(10)

    // Reset contracts to send RPCs through transferring node.
    web3.currentProvider = new web3.providers.HttpProvider('http://localhost:8549')

    // Unlock Node account
    await web3.eth.personal.unlockAccount(FromAddress, '', 1000000)
  }

  const transferCeloGold = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: {
      gas?: number
      gasPrice?: string
      gasCurrency?: string
      gasFeeRecipient?: string
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
      gasCurrency?: string
      gasFeeRecipient?: string
    } = {}
  ) => {
    const kitStableToken = await kit.contracts.getStableToken()
    const res = await kitStableToken.transfer(toAddress, amount.toString()).send({
      from: fromAddress,
      ...txOptions,
    })

    return res
  }

  const getGasPriceMinimum = async (gasCurrency: string | undefined) => {
    const gasPriceMinimum = await kit._web3Contracts.getGasPriceMinimum()
    if (gasCurrency) {
      return gasPriceMinimum.methods.getGasPriceMinimum(gasCurrency).call()
    } else {
      return gasPriceMinimum.methods.gasPriceMinimum().call()
    }
  }

  interface TestTxResults {
    txOk: boolean
    txFees: Fees
  }

  const runTestTransaction = async (
    txResult: TransactionResult,
    expectedGasUsed: number,
    gasCurrency?: string
  ): Promise<TestTxResults> => {
    const minGasPrice = await getGasPriceMinimum(gasCurrency)
    assert.isAbove(parseInt(minGasPrice, 10), 0)

    let txOk = false
    let receipt: undefined | TransactionReceipt
    try {
      receipt = await txResult.waitReceipt()
      logReceiptEvents(receipt)
      txOk = true
    } catch (err) {
      txOk = false
    }

    let usedGas = expectedGasUsed
    if (receipt) {
      if (receipt.gasUsed !== expectedGasUsed) {
        console.log('OOPSS: Different Gas', receipt.gasUsed, expectedGasUsed)
      }
      // assert.equal(receipt.gasUsed, expectedGasUsed, 'Expected gas doesnt match')
      usedGas = receipt.gasUsed
    }

    const txHash = await txResult.getHash()
    const tx = await web3.eth.getTransaction(txHash)
    const gasPrice = tx.gasPrice
    assert.isAbove(parseInt(gasPrice, 10), 0)
    const expectedTransactionFee = new BigNumber(usedGas).times(gasPrice)
    const expectedProposerFeeFraction = 0.5
    const expectedTransactionFeeToProposer = new BigNumber(usedGas)
      .times(minGasPrice)
      .times(expectedProposerFeeFraction)
    const expectedTransactionFeeToRecipient = expectedTransactionFee.minus(
      expectedTransactionFeeToProposer
    )
    const txFees = {
      total: expectedTransactionFee,
      proposer: expectedTransactionFeeToProposer,
      recipient: expectedTransactionFeeToRecipient,
    }

    return { txOk, txFees }
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
      gasFeeRecipient?: string
    }
  }) {
    let txRes: TestTxResults
    let balances: BalanceWatcher

    before(async () => {
      const gasCurrency =
        feeToken === CeloContract.StableToken
          ? await kit.registry.addressFor(CeloContract.StableToken)
          : undefined

      const accounts = [FromAddress, ToAddress, GovernanceAddress, FeeRecipientAddress]
      balances = await newBalanceWatcher(kit, accounts)

      const transferFn =
        transferToken === CeloContract.StableToken ? transferCeloDollars : transferCeloGold
      const txResult = await transferFn(FromAddress, ToAddress, TransferAmount, {
        ...txOptions,
        gasCurrency,
      })

      txRes = await runTestTransaction(txResult, expectedGas, gasCurrency)

      await balances.update()
    })

    if (expectSuccess) {
      it(`should succeed`, () => assert.isTrue(txRes.txOk))

      it(`should increment the receiver's ${transferToken} balance by the transfer amount`, () =>
        assertEqualBN(balances.delta(ToAddress, transferToken), TransferAmount))

      if (transferToken === feeToken) {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount plus the gas fee`, () => {
          const expectedBalanceChange = txRes.txFees.total.plus(TransferAmount)
          assertEqualBN(balances.delta(FromAddress, transferToken).negated(), expectedBalanceChange)
        })
      } else {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount`, () =>
          assertEqualBN(balances.delta(FromAddress, transferToken).negated(), TransferAmount))

        it(`should decrement the sender's ${feeToken} balance by the gas fee`, () =>
          assertEqualBN(balances.delta(FromAddress, feeToken).negated(), txRes.txFees.total))
      }
    } else {
      it(`should fail`, () => assert.isFalse(txRes.txOk))

      it(`should decrement the sender's ${feeToken} balance by the gas fee`, () =>
        assertEqualBN(balances.delta(FromAddress, feeToken).negated(), txRes.txFees.total))

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

    it(`should increment the gas fee recipient's ${feeToken} balance by a portion of the gas fee`, () =>
      assertEqualBN(balances.delta(FeeRecipientAddress, feeToken), txRes.txFees.recipient))

    // it(`should increment the infrastructure fund's ${feeToken} balance by the rest of the gas fee`, () => {
    //   assertEqualBN(
    //     newBalances[feeToken][governanceAddress]
    //       .minus(initialBalances[feeToken][governanceAddress])
    //       .mod(expectedInfrastructureBlockReward)
    //       ,
    //     txRes.expectedFees.infrastructure
    //   )
    // })
  }

  const syncModes = ['full', 'fast', 'light', 'ultralight']
  // const syncModes = ['full', 'fast']
  for (const syncMode of syncModes) {
    describe(`when running ${syncMode} sync`, () => {
      before(`start geth on sync: ${syncMode}`, () => restartGeth(syncMode))

      describe('when transferring Celo Gold', () => {
        const GOLD_TRANSACTION_GAS_COST = 29180
        describe('when paying for gas in Celo Gold', () => {
          if (syncMode === 'light' || syncMode === 'ultralight') {
            describe('when running in light/ultralight sync mode', () => {
              describe('when not explicitly specifying a gas fee recipient', () =>
                testTransferToken({
                  expectedGas: GOLD_TRANSACTION_GAS_COST,
                  transferToken: CeloContract.GoldToken,
                  feeToken: CeloContract.GoldToken,
                }))

              describe('when explicitly specifying the gas fee recipient', () => {
                describe("when using a peer's etherbase", () =>
                  testTransferToken({
                    expectedGas: GOLD_TRANSACTION_GAS_COST,
                    transferToken: CeloContract.GoldToken,
                    feeToken: CeloContract.GoldToken,
                    txOptions: {
                      gasFeeRecipient: FeeRecipientAddress,
                    },
                  }))

                describe('when setting to an arbitrary address', () => {
                  it('should get rejected by the sending node before being added to the tx pool', async () => {
                    try {
                      const res = await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                        gasFeeRecipient: web3.utils.randomHex(20),
                      })
                      await res.waitReceipt()
                    } catch (error) {
                      assert.include(
                        error.toString(),
                        'Returned error: no peer with etherbase found'
                      )
                    }
                  })
                })
              })
            })
          } else {
            testTransferToken({
              expectedGas: GOLD_TRANSACTION_GAS_COST,
              transferToken: CeloContract.GoldToken,
              feeToken: CeloContract.GoldToken,
              txOptions: {
                gasFeeRecipient: FeeRecipientAddress,
              },
            })
          }
        })

        describe('when paying for gas in Celo Dollars', () => {
          const intrinsicGas = 155000
          describe('when there is no demurrage', () => {
            describe('when setting a gas amount greater than the amount of gas necessary', () =>
              testTransferToken({
                expectedGas: 163180,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.StableToken,
                txOptions: {
                  gasFeeRecipient: FeeRecipientAddress,
                },
              }))

            describe('when setting a gas amount less than the amount of gas necessary but more than the intrinsic gas amount', () => {
              const gas = intrinsicGas + 1000
              testTransferToken({
                expectedGas: gas,
                transferToken: CeloContract.GoldToken,
                feeToken: CeloContract.StableToken,
                expectSuccess: false,
                txOptions: {
                  gas,
                  gasFeeRecipient: FeeRecipientAddress,
                },
              })
            })

            describe('when setting a gas amount less than the intrinsic gas amount', () => {
              it('should not add the transaction to the pool', async () => {
                const gas = intrinsicGas - 1
                const gasCurrency = await kit.registry.addressFor(CeloContract.StableToken)
                try {
                  const res = await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                    gas,
                    gasCurrency,
                  })
                  await res.getHash()
                } catch (error) {
                  assert.include(error.toString(), 'Returned error: intrinsic gas too low')
                }
              })
            })
          })

          describe.skip('when there is demurrage of 50% applied', () => {
            describe('when setting a gas amount greater than the amount of gas necessary', () => {
              let balances: BalanceWatcher
              let expectedFees: Fees

              before(async () => {
                balances = await newBalanceWatcher(kit, [
                  FromAddress,
                  ToAddress,
                  GovernanceAddress,
                  FeeRecipientAddress,
                ])

                await inflationManager.changeInflationFactorOnNextTransfer(new BigNumber(2))
                const stableTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
                const expectedGasUsed = 163180
                const txRes = await runTestTransaction(
                  await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                    gasCurrency: stableTokenAddress,
                    gasFeeRecipient: FeeRecipientAddress,
                  }),
                  expectedGasUsed,
                  stableTokenAddress
                )
                assert.isTrue(txRes.txOk)

                await balances.update()
                expectedFees = txRes.txFees
              })
              after('resetInflation', inflationManager.resetInflation)

              it("should decrement the sender's Celo Gold balance by the transfer amount", () => {
                assertEqualBN(
                  balances.delta(FromAddress, CeloContract.GoldToken).negated(),
                  TransferAmount
                )
              })

              it("should increment the receiver's Celo Gold balance by the transfer amount", () => {
                assertEqualBN(balances.delta(ToAddress, CeloContract.GoldToken), TransferAmount)
              })

              it("should halve the sender's Celo Dollar balance due to demurrage and decrement it by the gas fee", () => {
                assertEqualBN(
                  balances
                    .initial(FromAddress, CeloContract.StableToken)
                    .div(2)
                    .minus(balances.current(FromAddress, CeloContract.StableToken)),
                  expectedFees.total
                )
              })

              it("should increment the fee receipient's Celo Dollar balance by a portion of the gas fee", () => {
                assertEqualBN(
                  balances
                    .current(FeeRecipientAddress, CeloContract.StableToken)
                    .minus(balances.initial(FeeRecipientAddress, CeloContract.StableToken).div(2)),

                  // balances.delta(FeeRecipientAddress, CeloContract.StableToken),
                  expectedFees.recipient
                )
              })

              // TODO mcortesi
              // it("should increment the infrastructure fund's Celo Dollar balance by the rest of the gas fee", () => {
              //   assertEqualBN(
              //     newBalances[CeloContract.StableToken][governanceAddress]
              //       .minus(initialBalances[CeloContract.StableToken][governanceAddress])
              //       ,
              //     expectedFees.infrastructure
              //   )
              // })
            })

            describe('when setting a gas amount less than the amount of gas necessary but more than the intrinsic gas amount', () => {
              let balances: BalanceWatcher
              let expectedFees: Fees
              before(async () => {
                balances = await newBalanceWatcher(kit, [
                  FromAddress,
                  ToAddress,
                  GovernanceAddress,
                  FeeRecipientAddress,
                ])

                await inflationManager.changeInflationFactorOnNextTransfer(new BigNumber(2))

                const gas = intrinsicGas + 1000
                const txRes = await runTestTransaction(
                  await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                    gas,
                    gasCurrency: await kit.registry.addressFor(CeloContract.StableToken),
                    gasFeeRecipient: FeeRecipientAddress,
                  }),
                  gas,
                  await kit.registry.addressFor(CeloContract.StableToken)
                )
                assert.isFalse(txRes.txOk)

                await balances.update()
                expectedFees = txRes.txFees
              })
              after('resetInflation', inflationManager.resetInflation)

              it("should not change the sender's Celo Gold balance", () => {
                assertEqualBN(balances.delta(FromAddress, CeloContract.GoldToken), new BigNumber(0))
              })

              it("should not change the receiver's Celo Gold balance", () => {
                assertEqualBN(balances.delta(ToAddress, CeloContract.GoldToken), new BigNumber(0))
              })

              it("should halve the sender's Celo Dollar balance due to demurrage and decrement it by the gas fee", () => {
                assertEqualBN(
                  balances
                    .initial(FromAddress, CeloContract.StableToken)
                    .div(2)
                    .minus(balances.current(FromAddress, CeloContract.StableToken)),
                  expectedFees.total
                )
              })

              it("should increment the fee recipient's Celo Dollar balance by a portion of the gas fee", () => {
                assertEqualBN(
                  balances.delta(FeeRecipientAddress, CeloContract.StableToken),
                  expectedFees.recipient
                )
              })

              // TODO(mcortesi)
              // it("should increment the infrastructure fund's Celo Dollar balance by the rest of the gas fee", () => {
              //   assertEqualBN(
              //     newBalances[CeloContract.StableToken][governanceAddress]
              //       .minus(initialBalances[CeloContract.StableToken][governanceAddress])
              //       ,
              //     expectedFees.infrastructure
              //   )
              // })
            })

            describe.skip('when setting a gas amount less than the intrinsic gas amount', () => {
              it('should not add the transaction to the pool', async () => {
                const gas = intrinsicGas - 1

                inflationManager.changeInflationFactorOnNextTransfer(new BigNumber(2))

                try {
                  const res = await transferCeloGold(FromAddress, ToAddress, TransferAmount, {
                    gas,
                    gasCurrency: await kit.registry.addressFor(CeloContract.StableToken),
                  })
                  await res.waitReceipt()
                } catch (error) {
                  assert.include(error.toString(), 'Returned error: intrinsic gas too low')
                }
              })
              after(inflationManager.resetInflation)
            })
          })
        })
      })

      describe('when transferring Celo Dollars', () => {
        describe('when paying for gas in Celo Dollars', () => {
          testTransferToken({
            expectedGas: 189456,
            transferToken: CeloContract.StableToken,
            feeToken: CeloContract.StableToken,
            txOptions: {
              gasFeeRecipient: FeeRecipientAddress,
            },
          })
        })

        describe('when paying for gas in Celo Gold', () => {
          testTransferToken({
            expectedGas: 40456,
            transferToken: CeloContract.StableToken,
            feeToken: CeloContract.GoldToken,
            txOptions: {
              gasFeeRecipient: FeeRecipientAddress,
            },
          })
        })
      })
    })
  }
})
