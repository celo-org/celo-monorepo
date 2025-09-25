import { publicClientL1, publicClientL2, walletClientL2 } from './config.ts'
import { WITHDRAWAL_TX_HASH } from './env.ts'

const withdrawalTxHash = WITHDRAWAL_TX_HASH
if (typeof withdrawalTxHash !== 'string' || withdrawalTxHash.startsWith('0x') === false) {
  throw new Error('WITHDRAWAL_TX_HASH must be a string starting with 0x')
}

// Wait for the initiate withdrawal transaction receipt.
const receipt = await publicClientL2.waitForTransactionReceipt({
  hash: withdrawalTxHash as `0x${string}`,
})
console.log('Receipt:', receipt)

const status = await publicClientL1.getWithdrawalStatus({
  receipt,
  targetChain: walletClientL2.chain,
})
console.log('Status:', status)

// Wait until the withdrawal is ready to prove.
const { output, withdrawal } = await publicClientL1.waitToProve({
  receipt,
  targetChain: walletClientL2.chain,
})
console.log('Output:', output)
console.log('Withdrawal:', withdrawal)

// Build parameters to prove the withdrawal on the L2.
const proveArgs = await publicClientL2.buildProveWithdrawal({
  output,
  withdrawal,
})
console.log('Prove Args:', proveArgs)
