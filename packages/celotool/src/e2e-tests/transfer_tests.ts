import { CURRENCY_ENUM } from '@celo/utils'
import { toFixed } from '@celo/utils/lib/fixidity'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { erc20Abi, getContractAddress, getEnode, getHooks, initAndStartGeth, sleep } from './utils'

/**
 * If after changing a Smart Contract implementation the e2e transfer tests are failing,
 * typically you can fix the tests adapting the new gas estimations with the output of the
 * `ci_test_transfers.sh` script.
 *
 * E2E tests can be run in your local using the following command from the
 * `$ ./ci_test_transfers.sh local /full/path/to/celo-blockchain/`
 *
 * In the output of the script execution, look for the error messages similar to:
 * "AssertionError: expected '3804860' to equal '3789120'"
 * This error means an assertion was expecting a gas cost of 3789120 but 3804860 was found.
 * If the new gas cost makes sense, the best way to fix this is to divide the expected gas cost
 * by the gas price (20) (in our case 3789120/20= 189456). Look for the resulted number in this
 * script. If you find it, divide the result obtained by the gas price
 * (in our example 3804860/20= 190243) and replace the result for the old value (in our case replace
 * 189456 by 190243). This should fix most of the errors.
 *
 * If still you have some errors, apply the same pattern with the GOLD_TRANSACTION_GAS_COST variable.
 */

const stableTokenAbi = erc20Abi.concat([
  {
    constant: false,
    inputs: [
      {
        name: 'rate',
        type: 'uint256',
      },
      {
        name: 'updatePeriod',
        type: 'uint256',
      },
    ],
    name: 'setInflationParameters',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getInflationParameters',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
])

const gasPriceMinimumAbi = [
  {
    constant: true,
    inputs: [
      {
        name: '_tokenAddress',
        type: 'address',
      },
    ],
    name: 'getGasPriceMinimum',
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
    name: 'gasPriceMinimum',
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

describe('transfer tests', function(this: any) {
  this.timeout(0)

  const gethConfig = {
    migrateTo: 8,
    migrateGovernance: false,
    instances: [
      { name: 'validator', validating: true, syncmode: 'full', port: 30303, rpcport: 8545 },
    ],
  }
  const hooks = getHooks(gethConfig)
  before(hooks.before)
  after(hooks.after)

  let web3: Web3
  const DEF_AMOUNT: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))
  let stableToken: any
  let gasPriceMinimum: any
  let initialBalances: any
  let newBalances: any
  let expectedFees: any
  let txSuccess: boolean
  let stableTokenAddress: string
  let gasPriceMinimumAddress: string
  const expectedInfrastructureBlockReward: string = new BigNumber(
    Web3.utils.toWei('1', 'ether')
  ).toString()

  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const DEF_FROM_ADDR = '0x5409ed021d9299bf6814279a6a1411a7e866a631'

  // Arbitrary addresses.
  const DEF_TO_ADDR = '0xbBae99F0E1EE565404465638d40827b54D343638'
  const feeRecipientAddress = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'
  const governanceAddress = '0x1a748f924e5b346d68b2202e85ba6a2c72570b26'

  const restartGeth = async (syncmode: string) => {
    // Restart the validator node
    await hooks.restart()

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    web3 = new Web3('http://localhost:8545')
    await unlockAccount(validatorAddress)
    // We do not deploy the governance contract so that we can set inflation parameters on
    // StableToken. We instead, point the registry to a dummy address, so that we can test
    // transaction fees going to the infrastructure fund.
    const registryAddress = await getContractAddress('RegistryProxy')
    const registry = new web3.eth.Contract(registryAbi, registryAddress)
    const tx = registry.methods.setAddressFor('Governance', governanceAddress)
    const gas = await tx.estimateGas()
    await tx.send({ gas, from: validatorAddress })

    gasPriceMinimumAddress = await getContractAddress('GasPriceMinimumProxy')
    // TODO(asa): Move this to the `before`
    // Give the account we will send transfers as sufficient gold and dollars.
    stableTokenAddress = await getContractAddress('StableTokenProxy')

    const startBalance = DEF_AMOUNT.times(10)
    stableToken = new web3.eth.Contract(stableTokenAbi, stableTokenAddress)
    await transferCeloDollars(validatorAddress, DEF_FROM_ADDR, startBalance)
    await transferCeloGold(validatorAddress, DEF_FROM_ADDR, startBalance)

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
      etherbase: feeRecipientAddress,
      peers: [await getEnode(8545)],
    }
    await initAndStartGeth(hooks.gethBinaryPath, fullInstance)

    // Spin up the node to run transfers as.
    const syncInstance = {
      name: syncmode,
      validating: false,
      syncmode,
      port: 30307,
      rpcport: 8549,
      privateKey: DEF_FROM_PK,
      peers: [await getEnode(8547)],
    }
    await initAndStartGeth(hooks.gethBinaryPath, syncInstance)

    // TODO(asa): Reduce this to speed tests up.
    // Give the node time to sync the latest block.
    await sleep(10)

    // Reset contracts to send RPCs through transferring node.
    web3 = new Web3('http://localhost:8549')
    stableToken = new web3.eth.Contract(stableTokenAbi, stableTokenAddress)
    gasPriceMinimum = new web3.eth.Contract(gasPriceMinimumAbi, gasPriceMinimumAddress)
    initialBalances = await getBalances()
  }

  const unlockAccount = async (address: string) => {
    // Assuming empty password
    await web3.eth.personal.unlockAccount(address, '', 1000)
  }

  const transferCeloGold = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: any = {}
  ) => {
    await unlockAccount(fromAddress)
    // Hack to get the node to suggest a price for us.
    // Otherwise, web3 will suggest the default gold price.
    if (txOptions.gasCurrency) {
      txOptions.gasPrice = '0'
    }
    const tx: Tx = {
      from: fromAddress,
      to: toAddress,
      value: amount.toString(),
      ...txOptions,
    }
    if (!tx.gas) {
      tx.gas = await web3.eth.estimateGas(tx)
    }
    return new Promise(async (resolve, reject) => {
      try {
        await web3.eth
          .sendTransaction(tx)
          .on('confirmation', (_: any, receipt: any) => resolve(receipt))
      } catch (err) {
        reject(err)
      }
    })
  }

  const transferCeloDollars = async (
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    txOptions: any = {}
  ) => {
    await unlockAccount(fromAddress)
    // Hack to get the node to suggest a price for us.
    // Otherwise, web3 will suggest the default gold price.
    if (txOptions.gasCurrency) {
      txOptions.gasPrice = '0'
    }
    const tx = stableToken.methods.transfer(toAddress, amount.toString())
    let gas = txOptions.gas
    if (!gas) {
      gas = await tx.estimateGas({ ...txOptions })
    }

    return new Promise(async (resolve, reject) => {
      try {
        await tx
          .send({ from: fromAddress, ...txOptions, gas })
          .on('confirmation', (_: any, receipt: any) => resolve(receipt))
      } catch (err) {
        reject(err)
      }
    })
  }

  const setInflationParams = async (
    rateNumerator: number,
    rateDenominator: number,
    updatePeriod: number
  ) => {
    // We need to run this operation from the validator account as it is the owner of the
    // contract.
    const _web3 = new Web3('http://localhost:8545')
    const _stableToken = new _web3.eth.Contract(stableTokenAbi, stableTokenAddress)
    const tx = _stableToken.methods.setInflationParameters(
      toFixed(rateNumerator / rateDenominator).toString(),
      updatePeriod
    )
    const gas = await tx.estimateGas({ from: validatorAddress })
    return tx.send({ from: validatorAddress, gas })
  }

  const getBalances = async () => {
    const accounts = [DEF_FROM_ADDR, DEF_TO_ADDR, governanceAddress, feeRecipientAddress]
    const goldBalances: any = {}
    const dollarBalances: any = {}
    for (const a of accounts) {
      goldBalances[a] = new BigNumber(await web3.eth.getBalance(a))
      dollarBalances[a] = new BigNumber(await stableToken.methods.balanceOf(a).call())
    }
    const balances: any = {}
    balances[CURRENCY_ENUM.GOLD] = goldBalances
    balances[CURRENCY_ENUM.DOLLAR] = dollarBalances
    return balances
  }

  const getGasPriceMinimum = async (gasCurrency: string | undefined) => {
    if (gasCurrency) {
      return gasPriceMinimum.methods.getGasPriceMinimum(gasCurrency).call()
    } else {
      return gasPriceMinimum.methods.gasPriceMinimum().call()
    }
  }

  const runTestTransaction = async (
    txPromise: Promise<any>,
    expectedGasUsed: number,
    gasCurrency?: string
  ): Promise<[boolean, any, any]> => {
    const minGasPrice = await getGasPriceMinimum(gasCurrency)
    assert.isAbove(parseInt(minGasPrice, 10), 0)
    const receipt = await txPromise
    const balances = await getBalances()
    const tx = await web3.eth.getTransaction(receipt.transactionHash)
    const gasPrice = tx.gasPrice
    assert.isAbove(parseInt(gasPrice, 10), 0)
    const expectedTransactionFee = new BigNumber(expectedGasUsed).times(gasPrice)
    const expectedInfrastructureFeeFraction = 0.5
    const expectedTransactionFeeToInfrastructure = new BigNumber(expectedGasUsed)
      .times(minGasPrice)
      .times(expectedInfrastructureFeeFraction)
    const expectedTransactionFeeToRecipient = expectedTransactionFee.minus(
      expectedTransactionFeeToInfrastructure
    )
    const fees = {
      total: expectedTransactionFee,
      infrastructure: expectedTransactionFeeToInfrastructure,
      recipient: expectedTransactionFeeToRecipient,
    }
    return [receipt.status, balances, fees]
  }

  const assertBalances = (
    transferToken: CURRENCY_ENUM,
    feeToken: CURRENCY_ENUM,
    expectSuccess: boolean = true
  ) => {
    if (expectSuccess) {
      it(`should succeed`, () => {
        assert.isTrue(txSuccess)
      })
    } else {
      it(`should fail`, () => {
        assert.isFalse(txSuccess)
      })
    }
    if (expectSuccess) {
      if (transferToken !== feeToken) {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount`, () => {
          assert.equal(
            initialBalances[transferToken][DEF_FROM_ADDR].minus(
              newBalances[transferToken][DEF_FROM_ADDR]
            ).toString(),
            DEF_AMOUNT.toString()
          )
        })
      } else {
        it(`should decrement the sender's ${transferToken} balance by the transfer amount plus the gas fee`, () => {
          const expectedBalanceChange = expectedFees.total.plus(DEF_AMOUNT)
          assert.equal(
            initialBalances[transferToken][DEF_FROM_ADDR].minus(
              newBalances[transferToken][DEF_FROM_ADDR]
            ).toString(),
            expectedBalanceChange.toString()
          )
        })
      }

      it(`should increment the receiver's ${transferToken} balance by the transfer amount`, () => {
        assert.equal(
          newBalances[transferToken][DEF_TO_ADDR].minus(
            initialBalances[transferToken][DEF_TO_ADDR]
          ).toString(),
          DEF_AMOUNT.toString()
        )
      })
    } else if (transferToken !== feeToken) {
      it(`should not change the sender's ${transferToken} balance`, () => {
        assert.equal(
          initialBalances[transferToken][DEF_FROM_ADDR].toString(),
          newBalances[transferToken][DEF_FROM_ADDR].toString()
        )
      })

      it(`should not change the receiver's ${transferToken} balance`, () => {
        assert.equal(
          initialBalances[transferToken][DEF_TO_ADDR].toString(),
          newBalances[transferToken][DEF_TO_ADDR].toString()
        )
      })
    }

    if (!expectSuccess || transferToken !== feeToken) {
      it(`should decrement the sender's ${feeToken} balance by the gas fee`, () => {
        assert.equal(
          initialBalances[feeToken][DEF_FROM_ADDR].minus(
            newBalances[feeToken][DEF_FROM_ADDR]
          ).toString(),
          expectedFees.total.toString()
        )
      })
    }

    it(`should increment the gas fee recipient's ${feeToken} balance by a portion of the gas fee`, () => {
      assert.equal(
        newBalances[feeToken][feeRecipientAddress]
          .minus(initialBalances[feeToken][feeRecipientAddress])
          .toString(),
        expectedFees.recipient.toString()
      )
    })

    it(`should increment the infrastructure fund's ${feeToken} balance by the rest of the gas fee`, () => {
      assert.equal(
        newBalances[feeToken][governanceAddress]
          .minus(initialBalances[feeToken][governanceAddress])
          .mod(expectedInfrastructureBlockReward)
          .toString(),
        expectedFees.infrastructure.toString()
      )
    })
  }

  const GOLD_TRANSACTION_GAS_COST = 29967
  const syncModes = ['full', 'fast', 'light', 'ultralight']
  for (const syncMode of syncModes) {
    describe(`when running ${syncMode} sync`, () => {
      describe('when transferring Celo Gold', () => {
        describe('when paying for gas in Celo Gold', () => {
          if (syncMode === 'light' || syncMode === 'ultralight') {
            describe('when running in light/ultralight sync mode', () => {
              describe('when not explicitly specifying a gas fee recipient', () => {
                before(async function(this: any) {
                  await restartGeth(syncMode)
                  ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                    transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT),
                    GOLD_TRANSACTION_GAS_COST
                  )
                })

                assertBalances(CURRENCY_ENUM.GOLD, CURRENCY_ENUM.GOLD)
              })

              describe('when explicitly specifying the gas fee recipient', () => {
                describe("when using a peer's etherbase", () => {
                  before(async function(this: any) {
                    await restartGeth(syncMode)
                    ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                      transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                        gasFeeRecipient: feeRecipientAddress,
                      }),
                      GOLD_TRANSACTION_GAS_COST
                    )
                  })

                  assertBalances(CURRENCY_ENUM.GOLD, CURRENCY_ENUM.GOLD)
                })

                describe('when setting to an arbitrary address', () => {
                  it('should get rejected by the sending node before being added to the tx pool', async function(this: any) {
                    await restartGeth(syncMode)
                    try {
                      await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                        gasFeeRecipient: web3.utils.randomHex(20),
                      })
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
            before(async function(this: any) {
              await restartGeth(syncMode)
              ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                  gasFeeRecipient: feeRecipientAddress,
                }),
                GOLD_TRANSACTION_GAS_COST
              )
            })

            assertBalances(CURRENCY_ENUM.GOLD, CURRENCY_ENUM.GOLD)
          }
        })

        describe('when paying for gas in Celo Dollars', () => {
          const intrinsicGas = 155000
          describe('when there is no demurrage', () => {
            describe('when setting a gas amount greater than the amount of gas necessary', () => {
              before(async function(this: any) {
                await restartGeth(syncMode)

                const expectedGasUsed = 163967
                ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                  transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                    gasCurrency: stableTokenAddress,
                    gasFeeRecipient: feeRecipientAddress,
                  }),
                  expectedGasUsed,
                  stableTokenAddress
                )
              })
              assertBalances(CURRENCY_ENUM.GOLD, CURRENCY_ENUM.DOLLAR)
            })

            describe('when setting a gas amount less than the amount of gas necessary but more than the intrinsic gas amount', () => {
              before(async function(this: any) {
                await restartGeth(syncMode)
                const gas = intrinsicGas + 1000
                ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                  transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                    gas,
                    gasCurrency: stableTokenAddress,
                    gasFeeRecipient: feeRecipientAddress,
                  }),
                  gas,
                  stableTokenAddress
                )
              })

              assertBalances(CURRENCY_ENUM.GOLD, CURRENCY_ENUM.DOLLAR, false)
            })

            describe('when setting a gas amount less than the intrinsic gas amount', () => {
              it('should not add the transaction to the pool', async function(this: any) {
                await restartGeth(syncMode)
                const gas = intrinsicGas - 1
                try {
                  await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                    gas,
                    gasCurrency: stableTokenAddress,
                  })
                } catch (error) {
                  assert.include(error.toString(), 'Returned error: intrinsic gas too low')
                }
              })
            })
          })

          describe('when there is demurrage of 50% applied', () => {
            describe('when setting a gas amount greater than the amount of gas necessary', () => {
              before(async function(this: any) {
                await restartGeth(syncMode)

                // To avoid a scenario where large numbers of retroactive updates occur,
                // set updatePeriod so that the exponent is limited to 1 by fetching when the
                // inflationPeriod was last updated, then setting the difference between now and then
                // plus a small amount as the new updatePeriod. We then wait to get pas that updatePeriod
                // so that on transferCeloGold being called, demurrage of 50% is applied.
                const inflationParams = await stableToken.methods.getInflationParameters().call()
                const lastUpdated = new BigNumber(inflationParams[3])
                const timeSinceLastUpdated = new BigNumber(Math.floor(Date.now() / 1000)).minus(
                  lastUpdated
                )

                await setInflationParams(2, 1, timeSinceLastUpdated.toNumber())

                const expectedGasUsed = 163967
                ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                  transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                    gasCurrency: stableTokenAddress,
                    gasFeeRecipient: feeRecipientAddress,
                  }),
                  expectedGasUsed,
                  stableTokenAddress
                )
                assert.isTrue(txSuccess)
              })

              it("should decrement the sender's Celo Gold balance by the transfer amount", () => {
                assert.equal(
                  initialBalances[CURRENCY_ENUM.GOLD][DEF_FROM_ADDR].minus(
                    newBalances[CURRENCY_ENUM.GOLD][DEF_FROM_ADDR]
                  ).toString(),
                  DEF_AMOUNT.toString()
                )
              })

              it("should increment the receiver's Celo Gold balance by the transfer amount", () => {
                assert.equal(
                  newBalances[CURRENCY_ENUM.GOLD][DEF_TO_ADDR].minus(
                    initialBalances[CURRENCY_ENUM.GOLD][DEF_TO_ADDR]
                  ).toString(),
                  DEF_AMOUNT.toString()
                )
              })

              it("should halve the sender's Celo Dollar balance due to demurrage and decrement it by the gas fee", () => {
                assert.equal(
                  initialBalances[CURRENCY_ENUM.DOLLAR][DEF_FROM_ADDR].div(2)
                    .minus(newBalances[CURRENCY_ENUM.DOLLAR][DEF_FROM_ADDR])
                    .toString(),
                  expectedFees.total.toString()
                )
              })

              it("should increment the fee receipient's Celo Dollar balance by a portion of the gas fee", () => {
                assert.equal(
                  newBalances[CURRENCY_ENUM.DOLLAR][feeRecipientAddress]
                    .minus(initialBalances[CURRENCY_ENUM.DOLLAR][feeRecipientAddress])
                    .toString(),
                  expectedFees.recipient.toString()
                )
              })

              it("should increment the infrastructure fund's Celo Dollar balance by the rest of the gas fee", () => {
                assert.equal(
                  newBalances[CURRENCY_ENUM.DOLLAR][governanceAddress]
                    .minus(initialBalances[CURRENCY_ENUM.DOLLAR][governanceAddress])
                    .toString(),
                  expectedFees.infrastructure.toString()
                )
              })
            })

            describe('when setting a gas amount less than the amount of gas necessary but more than the intrinsic gas amount', () => {
              before(async function(this: any) {
                await restartGeth(syncMode)
                // To avoid a scenario where large numbers of retroactive updates occur,
                // set updatePeriod so that the exponent is limited to 1 by fetching when the
                // inflationPeriod was last updated, then setting the difference between now and then
                // plus a small amount as the new updatePeriod. We then wait to get pas that updatePeriod
                // so that on transferCeloGold being called, demurrage of 50% is applied.
                const inflationParams = await stableToken.methods.getInflationParameters().call()
                const lastUpdated = new BigNumber(inflationParams[3])
                const timeSinceLastUpdated = new BigNumber(Math.floor(Date.now() / 1000)).minus(
                  lastUpdated
                )

                await setInflationParams(2, 1, timeSinceLastUpdated.toNumber())

                const gas = intrinsicGas + 1000
                ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
                  transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                    gas,
                    gasCurrency: stableTokenAddress,
                    gasFeeRecipient: feeRecipientAddress,
                  }),
                  gas,
                  stableTokenAddress
                )
                assert.isFalse(txSuccess)
              })

              it("should not change the sender's Celo Gold balance", () => {
                assert.equal(
                  initialBalances[CURRENCY_ENUM.GOLD][DEF_FROM_ADDR].toString(),
                  newBalances[CURRENCY_ENUM.GOLD][DEF_FROM_ADDR].toString()
                )
              })

              it("should not change the receiver's Celo Gold balance", () => {
                assert.equal(
                  initialBalances[CURRENCY_ENUM.GOLD][DEF_TO_ADDR].toString(),
                  newBalances[CURRENCY_ENUM.GOLD][DEF_TO_ADDR].toString()
                )
              })

              it("should halve the sender's Celo Dollar balance due to demurrage and decrement it by the gas fee", () => {
                assert.equal(
                  initialBalances[CURRENCY_ENUM.DOLLAR][DEF_FROM_ADDR].div(2)
                    .minus(newBalances[CURRENCY_ENUM.DOLLAR][DEF_FROM_ADDR])
                    .toString(),
                  expectedFees.total.toString()
                )
              })

              it("should increment the fee recipient's Celo Dollar balance by a portion of the gas fee", () => {
                assert.equal(
                  newBalances[CURRENCY_ENUM.DOLLAR][feeRecipientAddress]
                    .minus(initialBalances[CURRENCY_ENUM.DOLLAR][feeRecipientAddress])
                    .toString(),
                  expectedFees.recipient.toString()
                )
              })

              it("should increment the infrastructure fund's Celo Dollar balance by the rest of the gas fee", () => {
                assert.equal(
                  newBalances[CURRENCY_ENUM.DOLLAR][governanceAddress]
                    .minus(initialBalances[CURRENCY_ENUM.DOLLAR][governanceAddress])
                    .toString(),
                  expectedFees.infrastructure.toString()
                )
              })
            })

            describe('when setting a gas amount less than the intrinsic gas amount', () => {
              it('should not add the transaction to the pool', async function(this: any) {
                await restartGeth(syncMode)
                const gas = intrinsicGas - 1

                // To avoid a scenario where large numbers of retroactive updates occur,
                // set updatePeriod so that the exponent is limited to 1 by fetching when the
                // inflationPeriod was last updated, then setting the difference between now and then
                // plus a small amount as the new updatePeriod. We then wait to get pas that updatePeriod
                // so that on transferCeloGold being called, demurrage of 50% is applied.
                const inflationParams = await stableToken.methods.getInflationParameters().call()
                const lastUpdated = new BigNumber(inflationParams[3])
                const timeSinceLastUpdated = new BigNumber(Math.floor(Date.now() / 1000)).minus(
                  lastUpdated
                )
                await setInflationParams(2, 1, timeSinceLastUpdated.toNumber())

                try {
                  await transferCeloGold(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                    gas,
                    gasCurrency: stableTokenAddress,
                  })
                } catch (error) {
                  assert.include(error.toString(), 'Returned error: intrinsic gas too low')
                }
              })
            })
          })
        })
      })

      describe('when transferring Celo Dollars', () => {
        describe('when paying for gas in Celo Dollars', () => {
          before(async function(this: any) {
            await restartGeth(syncMode)

            const expectedGasUsed = 190243
            ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
              transferCeloDollars(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                gasCurrency: stableTokenAddress,
                gasFeeRecipient: feeRecipientAddress,
              }),
              expectedGasUsed,
              stableTokenAddress
            )
          })
          assertBalances(CURRENCY_ENUM.DOLLAR, CURRENCY_ENUM.DOLLAR)
        })

        describe('when paying for gas in Celo Gold', () => {
          before(async function(this: any) {
            await restartGeth(syncMode)

            const expectedGasUsed = 56243
            ;[txSuccess, newBalances, expectedFees] = await runTestTransaction(
              transferCeloDollars(DEF_FROM_ADDR, DEF_TO_ADDR, DEF_AMOUNT, {
                gasFeeRecipient: feeRecipientAddress,
              }),
              expectedGasUsed
            )
            assert.isTrue(txSuccess)
          })
          assertBalances(CURRENCY_ENUM.DOLLAR, CURRENCY_ENUM.GOLD)
        })
      })
    })
  }
})
