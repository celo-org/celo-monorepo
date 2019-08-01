import BN from 'bn.js'
import ethjsutil from 'ethereumjs-util'
import Web3 from 'web3'

import assert = require('assert')

export type Address = string

export function zip<A, B, C>(fn: (a: A, b: B) => C, as: A[], bs: B[]) {
  const len = Math.min(as.length, bs.length)
  const res: C[] = []

  for (let i = 0; i < len; i++) {
    res.push(fn(as[i], bs[i]))
  }
  return res
}

export function compareBN(a: BN, b: BN) {
  if (a.eq(b)) {
    return 0
  } else if (a.lt(b)) {
    return -1
  } else {
    return 1
  }
}

export function eqAddress(a: Address, b: Address) {
  return a.replace('0x', '').toLowerCase() === b.replace('0x', '').toLowerCase()
}

export async function getPubKeyFromAddrAndWeb3(addr: string, web3: Web3) {
  const msg = new Buffer('dummy_msg_data')
  const data = '0x' + msg.toString('hex')
  // Note: Eth.sign typing displays incorrect parameter order
  const sig = await web3.eth.sign(data, addr)

  const rawsig = ethjsutil.fromRpcSig(sig)

  const prefix = new Buffer('\x19Ethereum Signed Message:\n')
  const prefixedMsg = ethjsutil.sha3(Buffer.concat([prefix, new Buffer(String(msg.length)), msg]))
  const pubKey = ethjsutil.ecrecover(prefixedMsg, rawsig.v, rawsig.r, rawsig.s)

  const pubKeyStr = '0x' + pubKey.toString('hex')
  const hash = Web3.utils.keccak256(pubKeyStr)
  const computedAddr = '0x' + hash.slice(24 + 2)

  assert(eqAddress(computedAddr, addr), 'computed address !== addr')

  return pubKey
}

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
