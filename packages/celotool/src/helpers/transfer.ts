import BigNumber from 'bignumber.js'
import { displaySendTx } from '../../../cli/lib/utils/cli'
import { newKit } from '@celo/contractkit'

const from: string = process.env.FROM || '0x0'
const to: string = process.env.TO || '0x0'
const amountInWei = new BigNumber(process.env.AMOUNT || 0)
;(async () => {
  const kit = newKit('http://localhost:8545')
  const goldToken = await kit.contracts.getGoldToken()

  // Check the balance before
  const balanceFromBeforeInWei = await goldToken.balanceOf(to)
  console.log('balance to  :', balanceFromBeforeInWei.toString())
  const balanceToBeforeInWei = await goldToken.balanceOf(from)
  console.log('balance from:', balanceToBeforeInWei.toString())

  // Perform the transfer
  await displaySendTx('gold.Transfer', goldToken.transfer(to, amountInWei.toFixed()), {
    from: from,
  })

  // Check the balance after
  const balanceFromAfterInWei = await goldToken.balanceOf(to)
  console.log('new balance to  :', balanceFromAfterInWei.toString())
  const balanceToAfterInWei = await goldToken.balanceOf(from)
  console.log('new balance from:', balanceToAfterInWei.toString())
  // Get gas cost
  const differenceInWei = balanceFromBeforeInWei.minus(balanceFromAfterInWei)
  const gasCostInWei = differenceInWei.minus(amountInWei)

  // }
  console.log(`transfer ${amountInWei} from ${from} to ${to} - gas: ${gasCostInWei}`)
})()
