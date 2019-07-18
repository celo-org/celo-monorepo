import * as utf8 from 'utf8'
// @ts-ignore
import * as Web3EthAbi from 'web3-eth-abi'
// @ts-ignore
import { hexToUtf8 } from 'web3-utils'
import { Log, Transfer } from './blockscout'

// Note: topic0 here refers to the sha3 of an ERC20 Transfer event paremeter signature
// https://codeburst.io/deep-dive-into-ethereum-logs-a8d2047c7371
const transferTopic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const commentTopic0 = '0xe5d4e30fb8364e57bc4d662a07d0cf36f4c34552004c4c3624620a2c1d1c03dc'

export function decodeLogs(logs: Log[]) {
  const transfers = new Map<string, Transfer>()
  const comments = new Map<string, string>()
  let latestBlock = 0

  for (const log of logs) {
    latestBlock = Math.max(latestBlock, parseInt(log.blockNumber, 16))
    const topic0 = getLogTopic0(log)
    if (topic0 === transferTopic0) {
      const decodedLog = decodeTransferLog(log)
      if (decodedLog) {
        transfers.set(log.transactionHash, decodedLog)
      }
    } else if (topic0 === commentTopic0) {
      comments.set(log.transactionHash, decodeCommentLog(log))
    }
  }

  // Zip the comments into the transfers
  for (const [txHash, comment] of comments) {
    if (transfers.has(txHash)) {
      transfers.get(txHash)!.comment = comment
    }
  }

  return { transfers, latestBlock }
}

function getLogTopic0(log: Log): string | null {
  if (log && log.topics && log.topics.length) {
    return log.topics[0]
  } else {
    return null
  }
}

function decodeTransferLog(log: Log): Transfer | null {
  if (!log || !log.topics || !log.data) {
    console.error('Invalid transfer log:', log)
    return null
  }

  /**
   * Decode using the parameter signture for an ERC20 Transfer event
   * For unknown reasons, blockscout includes an extra unknown param in the log's topics list
   * Including this unknown param in the input list or decoding won't work
   */
  try {
    const decodedLog: any = Web3EthAbi.default.decodeLog(
      [
        {
          indexed: true,
          name: 'unknown',
          type: 'address',
        },
        {
          indexed: true,
          name: 'from',
          type: 'address',
        },
        {
          indexed: true,
          name: 'to',
          type: 'address',
        },
        {
          indexed: false,
          name: 'value',
          type: 'uint256',
        },
      ],
      log.data,
      log.topics.filter((t) => t !== null)
    )

    return {
      recipient: decodedLog.to.toLowerCase(),
      sender: decodedLog.from.toLowerCase(),
      value: decodedLog.value,
      blockNumber: parseInt(log.blockNumber, 16),
      timestamp: parseInt(log.timeStamp, 16) * 1000,
      txHash: log.transactionHash,
    }
  } catch (error) {
    console.error('Error decoding transfer log', error)
    return null
  }
}

// Taken from blockchain-api utils
function decodeCommentLog(log: Log): string {
  if (!log || !log.data || log.data.length < 68) {
    console.error('Invalid comment log:', log)
    return ''
  }
  // Slice at 66 because the data field encodes other params too
  const commentPortion = '0x' + log.data.slice(66)
  try {
    return utf8.decode(
      hexToUtf8(commentPortion)
        .slice(1)
        .trim()
    )
  } catch (error) {
    console.error('Error decoding comment log', error)
    return ''
  }
}
