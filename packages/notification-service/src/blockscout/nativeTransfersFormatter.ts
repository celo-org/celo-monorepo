import { TokenTransfer, Transfer } from './blockscout'

export function formatNativeTransfers(transfers: TokenTransfer[]) {
  // tx hash -> Transfers[]
  const transfersByTxHash = new Map<string, Transfer[]>()
  let latestBlock = 0

  for (const transfer of transfers) {
    latestBlock = Math.max(latestBlock, parseInt(transfer.blockNumber, 16))
    const formattedTransfer = formatTransfer(transfer)
    if (formattedTransfer) {
      const existingTransfers = transfersByTxHash.get(transfer.transactionHash) || []
      existingTransfers.push(formattedTransfer)
      transfersByTxHash.set(transfer.transactionHash, existingTransfers)
    }
  }

  return { transfers: transfersByTxHash, latestBlock }
}

function formatTransfer(transfer: TokenTransfer): Transfer | null {
  if (transfer.data) {
    return null
  }

  return {
    recipient: transfer.toAddressHash.toLowerCase(),
    sender: transfer.fromAddressHash.toLowerCase(),
    value: transfer.amount,
    blockNumber: parseInt(transfer.blockNumber, 16),
    timestamp: parseInt(transfer.timeStamp, 16) * 1000,
    txHash: transfer.transactionHash,
  }
}
