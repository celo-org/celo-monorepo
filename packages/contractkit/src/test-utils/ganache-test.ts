import * as fs from 'fs'
import Web3 from 'web3'
import { JsonRPCResponse } from 'web3/providers'
import { injectDebugProvider } from '../providers/debug-provider'

// This file specifies accounts available when ganache is running. These are derived
// from the MNEMONIC
export const NetworkConfig = JSON.parse(
  fs.readFileSync('src/test-utils/migration-override.json').toString()
)

export function jsonRpcCall<O>(web3: Web3, method: string, params: any[]): Promise<O> {
  return new Promise<O>((resolve, reject) => {
    web3.currentProvider.send(
      {
        id: new Date().getTime(),
        jsonrpc: '2.0',
        method,
        params,
      },
      (err: Error | null, res?: JsonRPCResponse) => {
        if (err) {
          reject(err)
        } else if (!res) {
          reject(new Error('no response'))
        } else if (res.error) {
          reject(
            new Error(
              `Failed JsonRPCResponse: method: ${method} params: ${params} error: ${JSON.stringify(
                res.error
              )}`
            )
          )
        } else {
          resolve(res.result)
        }
      }
    )
  })
}

export function evmRevert(web3: Web3, snapId: string): Promise<void> {
  return jsonRpcCall(web3, 'evm_revert', [snapId])
}

export function evmSnapshot(web3: Web3) {
  return jsonRpcCall<string>(web3, 'evm_snapshot', [])
}

export function testWithGanache(name: string, fn: (web3: Web3) => void) {
  const web3 = new Web3('http://localhost:8545')
  injectDebugProvider(web3)

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
