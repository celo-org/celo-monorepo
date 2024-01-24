import Web3 from 'web3'
import { JsonRpcResponse } from 'web3-core-helpers'
import migrationOverride from './migration-override.json'

export const NetworkConfig = migrationOverride

export function jsonRpcCall<O>(web3: Web3, method: string, params: any[]): Promise<O> {
  return new Promise<O>((resolve, reject) => {
    if (web3.currentProvider && typeof web3.currentProvider !== 'string') {
      web3.currentProvider.send(
        {
          id: new Date().getTime(),
          jsonrpc: '2.0',
          method,
          params,
        },
        (err: Error | null, res?: JsonRpcResponse) => {
          if (err) {
            reject(err)
          } else if (!res) {
            reject(new Error('no response'))
          } else if (res.error) {
            reject(
              new Error(
                `Failed JsonRpcResponse: method: ${method} params: ${JSON.stringify(
                  params
                )} error: ${JSON.stringify(res.error)}`
              )
            )
          } else {
            // eslint-disable-next-line  @typescript-eslint/no-unsafe-argument
            resolve(res.result)
          }
        }
      )
    } else {
      reject(new Error('Invalid provider'))
    }
  })
}

export async function timeTravel(seconds: number, web3: Web3) {
  await jsonRpcCall(web3, 'evm_increaseTime', [seconds])
  await jsonRpcCall(web3, 'evm_mine', [])
}

export async function mineBlocks(blocks: number, web3: Web3) {
  for (let i = 0; i < blocks; i++) {
    await jsonRpcCall(web3, 'evm_mine', [])
  }
}

export function evmRevert(web3: Web3, snapId: string): Promise<void> {
  return jsonRpcCall(web3, 'evm_revert', [snapId])
}

export function evmSnapshot(web3: Web3) {
  return jsonRpcCall<string>(web3, 'evm_snapshot', [])
}

export function testWithGanache(name: string, fn: (web3: Web3) => void) {
  const web3 = new Web3('http://localhost:8545')

  describe(name, () => {
    let snapId: string | null = null

    beforeEach(async () => {
      if (snapId != null) {
        await evmRevert(web3, snapId)
      }
      snapId = await evmSnapshot(web3)
    })

    afterAll(async () => {
      if (snapId != null) {
        await evmRevert(web3, snapId)
      }
    })

    fn(web3)
  })
}

/**
 * Gets a contract address by parsing blocks and matching event signatures against the given event.
 */
export async function getContractFromEvent(
  eventSignature: string,
  web3: Web3,
  filter?: {
    expectedData?: string
    index?: number
  }
): Promise<string> {
  const logs = await web3.eth.getPastLogs({
    topics: [web3.utils.sha3(eventSignature)],
    fromBlock: 'earliest',
    toBlock: 'latest',
  })
  if (logs.length === 0) {
    throw Error(`Error: contract could not be found matching signature ${eventSignature}`)
  }
  const logIndex = filter?.index ?? 0
  if (!filter?.expectedData) {
    return logs[logIndex].address
  }
  const filteredLogs = logs.filter((log) => log.data === filter.expectedData)
  if (filteredLogs.length === 0) {
    throw Error(
      `Error: contract could not be found matching signature ${eventSignature} with data ${filter.expectedData}`
    )
  }
  return filteredLogs[logIndex ?? 0].address
}
