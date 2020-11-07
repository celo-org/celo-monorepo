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
                `Failed JsonRpcResponse: method: ${method} params: ${params} error: ${JSON.stringify(
                  res.error
                )}`
              )
            )
          } else {
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
 * `canValidate` actually controls whether we grab the first or second contract associated with
 * the given `eventSignature`. This is to allow for deployment of two contracts with distinct
 * setup parameters for testing.
 */
export async function getContractFromEvent(
  eventSignature: string,
  web3: Web3,
  canValidate: boolean
): Promise<string> {
  let currBlockNumber = await web3.eth.getBlockNumber()
  let currBlock: any
  let contractAddress: any
  const target = web3.utils.sha3(eventSignature)
  let found = false
  while (true) {
    currBlock = await web3.eth.getBlock(currBlockNumber)
    for (const tx of currBlock.transactions) {
      const txFull = await web3.eth.getTransactionReceipt(tx)
      if (txFull.logs) {
        for (const log of txFull.logs) {
          if (log.topics) {
            for (const topic of log.topics) {
              if (topic === target) {
                if (canValidate && !found) {
                  found = true
                } else {
                  contractAddress = log.address
                }
              }
            }
          }
        }
      }
    }
    currBlockNumber--
    if (contractAddress !== undefined) {
      break
    }
    if (currBlockNumber < 0) {
      throw Error('Error: ReleaseGoldInstance could not be found')
    }
  }
  return contractAddress
}
