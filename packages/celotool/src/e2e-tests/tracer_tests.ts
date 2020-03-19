import { ContractKit, newKit } from '@celo/contractkit'
import { Address } from '@celo/contractkit/lib/base'
import { AccountAssets, trackTransfers } from '@celo/contractkit/lib/explorer/assets'
import { normalizeAddress } from '@celo/utils/src/address'
import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import Web3 from 'web3'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getContext, sleep } from './utils'

const TMP_PATH = '/tmp/e2e'

function assertEqualBN(value: BigNumber, expected: BigNumber) {
  assert.equal(value.toString(), expected.toString())
}

describe('tracer tests', () => {
  const validatorAddress = '0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95'
  const FromAddress = validatorAddress
  const ToAddress = '0xbBae99F0E1EE565404465638d40827b54D343638'
  /*const FromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
  const DEF_FROM_PK = 'f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d'
  const FeeRecipientAddress = '0x4f5f8a3f45d179553e7b95119ce296010f50f6f1'*/
  const TransferAmount: BigNumber = new BigNumber(Web3.utils.toWei('1', 'ether'))

  const gethConfig: GethRunConfig = {
    runPath: TMP_PATH,
    networkId: 1101,
    network: 'local',
    migrate: true,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30303,
        rpcport: 8545,
      },
      {
        name: 'validator1',
        validating: true,
        syncmode: 'full',
        port: 30305,
        rpcport: 8547,
      },
      {
        name: 'validator2',
        validating: true,
        syncmode: 'full',
        port: 30307,
        rpcport: 8549,
      },
    ],
  }

  const context: any = getContext(gethConfig)
  let kit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    //await context.hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    //await context.hooks.after()
    await sleep(10000000000)
  })

  const restart = async () => {
    await context.hooks.restart()
    kit = newKit('http://localhost:8545')
    kit.defaultAccount = validatorAddress

    // TODO(mcortesi): magic sleep. without it unlockAccount sometimes fails
    await sleep(2)
    // Assuming empty password
    await kit.web3.eth.personal.unlockAccount(validatorAddress, '', 1000000)

    // Give the account we will send transfers as sufficient gold and dollars.
    if (FromAddress != validatorAddress) {
      const startBalance = TransferAmount.times(500)
      const resDollars = await transferCeloDollars(validatorAddress, FromAddress, startBalance)
      const resGold = await transferCeloGold(validatorAddress, FromAddress, startBalance)
      await Promise.all([resDollars.waitReceipt(), resGold.waitReceipt()])
    }
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

  describe('Tracer tests', () => {
    before(async function() {
      this.timeout(0)
      await restart()
    })

    describe('transfer celo gold', () => {
      let trackBalances: Record<Address, AccountAssets>

      before(async function(this: any) {
        this.timeout(0)
        const txResult = await transferCeloGold(FromAddress, ToAddress, TransferAmount)
        const receipt = await txResult.waitReceipt()
        console.info('receipt')
        console.info(receipt)
        trackBalances = await trackTransfers(kit, receipt.blockNumber)
        console.info('trackBalances')
        console.info(trackBalances)
      })
      it(`cGLD tracer should increment the receiver's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(ToAddress)].gold,
          new BigNumber(TransferAmount)
        ))
      it(`cGLD tracer should decrement the sender's balance by the transfer amount`, () =>
        assertEqualBN(
          trackBalances[normalizeAddress(FromAddress)].gold,
          new BigNumber(-TransferAmount)
        ))
    })
  })
})
