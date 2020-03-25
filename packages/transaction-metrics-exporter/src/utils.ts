import fetch from 'node-fetch'
import { ParsedBlock, ParsedTx } from '@celo/contractkit/lib/explorer/block-explorer'

const EMPTY_INPUT = 'empty_input'
const NO_METHOD_ID = 'no_method_id'
const UNKNOWN_METHOD = 'unknown_method'

export function toMethodId(txInput: string, isKnownCall: boolean): string {
  let methodId: string
  if (txInput === '0x') {
    methodId = EMPTY_INPUT
  } else if (txInput.startsWith('0x')) {
    methodId = isKnownCall ? txInput.slice(0, 10) : UNKNOWN_METHOD
  } else {
    // pretty much should never get here
    methodId = NO_METHOD_ID
  }
  return methodId
}

export function toTxMap(parsedBlock: ParsedBlock): Map<string, ParsedTx> {
  const parsedTxMap: Map<string, ParsedTx> = new Map()
  parsedBlock.parsedTx.forEach((ptx) => {
    parsedTxMap.set(ptx.tx.hash, ptx)
  })
  return parsedTxMap
}

export function getInternalTransactions(hash: string) {
  return fetch('https://baklavastaging-blockscout.celo-testnet.org/graphiql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
      {
        transaction(hash: "${hash}") {
          internalTransactions(first: 6) {
            edges {
              node {
                blockNumber
                callType
                createdContractAddressHash
                error
                fromAddressHash
                gas
                gasUsed
                id
                index
                input
                output
                toAddressHash
                traceAddress
                transactionHash
                transactionIndex
                type
                value
              } 
            }
          }
        }
      }
    `,
    }),
  })
    .then((res: any) => res.json())
    .then(
      ({ data }: any) =>
        data.transaction.internalTransactions.edges.map(({ node }: any) => node) as any[]
    )
}
