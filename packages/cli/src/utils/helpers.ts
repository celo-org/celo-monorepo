import { eqAddress } from '@celo/utils/lib/address'
import ethjsutil from 'ethereumjs-util'
import Web3 from 'web3'

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

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
