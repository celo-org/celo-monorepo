import { Address } from '@celo/utils/lib/address'
import abi, { ABIDefinition } from 'web3-eth-abi'
import { Block, Transaction } from 'web3/eth/types'
import { EventLog, Log, TransactionReceipt } from 'web3/types'
import { ContractKit } from '../kit'
import { ContractDetails, mapFromPairs, obtainKitContractDetails } from './base'

export interface CallDetails {
  contract: string
  function: string
  parameters: Record<string, any>
}

export interface ParsedTx {
  callDetails: CallDetails
  tx: Transaction
}

export interface ParsedBlock {
  block: Block
  parsedTx: ParsedTx[]
}

interface ContractMapping {
  details: ContractDetails
  logMapping: Map<string, ABIDefinition>
}

export async function newLogExplorer(kit: ContractKit) {
  return new LogExplorer(kit, await obtainKitContractDetails(kit))
}

export class LogExplorer {
  private readonly addressMapping: Map<Address, ContractMapping>

  constructor(private kit: ContractKit, readonly contractDetails: ContractDetails[]) {
    this.addressMapping = mapFromPairs(
      contractDetails.map((cd) => [
        cd.address,
        {
          details: cd,
          logMapping: mapFromPairs(
            (cd.jsonInterface as ABIDefinition[])
              .filter((ad) => ad.type === 'event')
              .map((ad) => [ad.signature, ad])
          ),
        },
      ])
    )

    for (const cd of contractDetails) {
      const fnMapping: Map<string, ABIDefinition> = new Map()
      for (const abiDef of cd.jsonInterface as ABIDefinition[]) {
        if (abiDef.type === 'event') {
          fnMapping.set(abiDef.signature, abiDef)
        }
      }

      this.addressMapping.set(cd.address, {
        details: cd,
        logMapping: fnMapping,
      })
    }
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
    const matchedAbi = contractMapping.logMapping.get(logSignature)
    if (matchedAbi == null) {
      return null
    }

    const returnValues = abi.decodeLog(matchedAbi.inputs || [], log.data || '', log.topics.slice(1))
    delete (returnValues as any).__length__

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
