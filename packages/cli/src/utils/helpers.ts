import { eqAddress } from '@celo/utils/lib/address'
import ethjsutil from 'ethereumjs-util'
import Web3 from 'web3'
import { Block } from 'web3/eth/types'
import { failWith } from './cli'

import assert = require('assert')

export async function getPubKeyFromAddrAndWeb3(addr: string, web3: Web3) {
  const msg = new Buffer('dummy_msg_data')
  const data = '0x' + msg.toString('hex')
  // Note: Eth.sign typing displays incorrect parameter order
  const sig = await web3.eth.sign(data, addr)

  const rawsig = ethjsutil.fromRpcSig(sig)

  const prefix = new Buffer('\x19Ethereum Signed Message:\n')
  const prefixedMsg = ethjsutil.sha3(Buffer.concat([prefix, new Buffer(String(msg.length)), msg]))
  const pubKey = ethjsutil.ecrecover(prefixedMsg, rawsig.v, rawsig.r, rawsig.s)

  const computedAddr = ethjsutil.pubToAddress(pubKey).toString('hex')
  assert(eqAddress(computedAddr, addr), 'computed address !== addr')

  return pubKey
}

export async function nodeIsSynced(web3: Web3): Promise<boolean> {
  try {
    // isSyncing() returns an object describing sync progress if syncing is actively
    // happening, and the boolean value `false` if not.
    // However, `false` can also indicate the syncing hasn't started, so here we
    // also need to check the latest block number
    const syncProgress = await web3.eth.isSyncing()
    if (typeof syncProgress === 'boolean' && !syncProgress) {
      const latestBlock: Block = await web3.eth.getBlock('latest')
      if (latestBlock && latestBlock.number > 0) {
        // To catch the case in which syncing has happened in the past,
        // has stopped, and hasn't started again, check for an old timestamp
        // on the latest block
        const ageOfBlock = Date.now() / 1000 - latestBlock.timestamp
        if (ageOfBlock > 120) {
          console.log(
            `Latest block is ${ageOfBlock} seconds old, and syncing is not currently in progress`
          )
          return false
        } else {
          return true
        }
      }
    }
    return false
  } catch (error) {
    console.log('An error occurred while trying to reach the node.')
    console.log(error)
    return false
  }
}

export async function requireNodeIsSynced(web3: Web3) {
  if (!(await nodeIsSynced(web3))) {
    failWith('Node is not currently synced. Run node:synced to check its status')
  }
}

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
