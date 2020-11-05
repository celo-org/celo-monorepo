import { EventLog, Log, TransactionReceipt } from 'web3-core'
import abi from 'web3-eth-abi'
import { ContractKit } from '../kit'
import { BaseExplorer } from './base'

export async function newLogExplorer(kit: ContractKit) {
  const logExplorer = new LogExplorer(kit)
  await logExplorer.init()
  return logExplorer
}

export class LogExplorer extends BaseExplorer {
  constructor(kit: ContractKit) {
    super(kit, 'event')
  }

  async fetchTxReceipt(txhash: string): Promise<TransactionReceipt> {
    return this.kit.web3.eth.getTransactionReceipt(txhash)
  }

  getKnownLogs(tx: TransactionReceipt): EventLog[] {
    const res: EventLog[] = []
    for (const log of tx.logs || []) {
      const event = this.tryParseLog(log)
      if (event != null) {
        res.push(event)
      }
    }
    return res
  }

  tryParseLog(log: Log): null | EventLog {
    if (log.topics.length === 0) {
      return null
    }

    const contractMapping = this.addressMapping.get(log.address)
    if (contractMapping == null) {
      return null
    }
    const logSignature = log.topics[0]
    const matchedAbi = contractMapping.abiMapping.get(logSignature)
    if (matchedAbi == null) {
      return null
    }

    const returnValues = abi.decodeLog(matchedAbi.inputs || [], log.data || '', log.topics.slice(1))
    delete (returnValues as any).__length__
    Object.keys(returnValues).forEach((key) => {
      if (Number.parseInt(key, 10) >= 0) {
        delete (returnValues as any)[key]
      }
    })

    const logEvent: EventLog & { signature: string } = {
      address: log.address,
      blockHash: log.blockHash,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      transactionIndex: log.transactionIndex,
      transactionHash: log.transactionHash,
      returnValues,
      event: matchedAbi.name!,
      signature: logSignature,
      raw: {
        data: log.data || '',
        topics: log.topics || [],
      },
    }

    return logEvent
  }
}
