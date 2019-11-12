import { CURRENCY_ENUM } from '@celo/utils'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { Tx } from 'web3/eth/types'
import { erc20Abi, getContractAddress } from '../e2e-tests/utils'

// import LockedGold from './artifacts/LockedGold'

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
const strip0xFromAddress = (addressWith0x: string) => addressWith0x.split('x')[1]

const transferCeloGold = async (
  fromAddress: string,
  toAddress: string,
  amount: BigNumber,
  txOptions: any = {}
) => {
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

const web3 = new Web3('http://localhost:8545')
const from: string = strip0xFromAddress(process.env.FROM || '0x0')
const to: string = strip0xFromAddress(process.env.TO || '0x0')
const NUM_TX = process.env.NUM_TX || 40
const AMOUNT = new BigNumber(process.env.AMOUNT || 0)

const randomItem = (list: string[]) => {
  return list[Math.floor(Math.random() * list.length)]
}
;(async () => {
  const stableTokenAddress = await getContractAddress('StableTokenProxy')
  const stableToken = new web3.eth.Contract(stableTokenAbi, stableTokenAddress)
  const getBalance = async (address: string) => {
    const balance: any = {}
    const goldBalance = new BigNumber(await web3.eth.getBalance(address))
    const dollarBalance = new BigNumber(await stableToken.methods.balanceOf(address).call())
    balance[CURRENCY_ENUM.GOLD] = goldBalance
    balance[CURRENCY_ENUM.DOLLAR] = dollarBalance
    return balance
  }

  const accounts = await web3.eth.getAccounts()

  for (let k = 0; k < NUM_TX; k++) {
    const toAddress = to === '0x0' ? strip0xFromAddress(randomItem(accounts)) : to
    const feeRecipientAddress = randomItem(accounts)
    const balance = await getBalance(from)
    let amount = AMOUNT
      ? AMOUNT
      : new BigNumber(Math.floor((Math.random() * balance[CURRENCY_ENUM.GOLD]) / 10000))

    await transferCeloGold(from, toAddress, amount, {
      gasCurrency: stableTokenAddress,
      gasFeeRecipient: feeRecipientAddress,
    })
    console.log(
      k,
      amount.toString(),
      balance[CURRENCY_ENUM.GOLD].toString(),
      balance[CURRENCY_ENUM.DOLLAR].toString()
    )
  }
})()
