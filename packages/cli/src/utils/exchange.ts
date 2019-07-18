import Web3 from 'web3'
import { Exchange } from '../generated/contracts'
import { IERC20Token } from '../generated/types/IERC20Token'
import { displaySendTx } from './cli'

export const swapArguments = [
  {
    name: 'sellAmount',
    required: true,
    description: 'the amount of sellToken (in wei) to sell',
  },
  {
    name: 'minBuyAmount',
    required: true,
    description: 'the minimum amount of buyToken (in wei) expected',
  },
  {
    name: 'from',
    required: true,
  },
]

interface SwapArgs {
  // TODO: use big numbers
  sellAmount: string
  minBuyAmount: string
  from: string
}

export const doSwap = async (
  web3: Web3,
  args: SwapArgs,
  sellToken: IERC20Token,
  sellGold: boolean
) => {
  const exchange = await Exchange(web3, args.from)

  const approveTx = sellToken.methods.approve(exchange._address, args.sellAmount)
  await displaySendTx('approve', approveTx)

  const exchangeTx = exchange.methods.exchange(args.sellAmount, args.minBuyAmount, sellGold)
  await displaySendTx('exchange', exchangeTx)
}
