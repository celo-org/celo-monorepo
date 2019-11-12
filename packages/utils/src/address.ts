import {
  ecrecover,
  fromRpcSig,
  pubToAddress,
  privateToAddress,
  privateToPublic,
  sha3,
  toChecksumAddress,
} from 'ethereumjs-util'
import Web3 from 'web3'
import assert = require('assert')

export type Address = string

export async function addressToPublicKey(address: string, web3: Web3) {
  const msg = new Buffer('dummy_msg_data')
  const data = '0x' + msg.toString('hex')
  // Note: Eth.sign typing displays incorrect parameter order
  const sig = await web3.eth.sign(data, address)

  const rawsig = fromRpcSig(sig)

  const prefix = new Buffer('\x19Ethereum Signed Message:\n')
  const prefixedMsg = sha3(Buffer.concat([prefix, new Buffer(String(msg.length)), msg]))
  const pubKey = ecrecover(prefixedMsg, rawsig.v, rawsig.r, rawsig.s)

  const computedAddr = pubToAddress(pubKey).toString('hex')
  assert(eqAddress(computedAddr, address), 'computed address !== address')

  return '0x' + pubKey.toString('hex')
}

export function eqAddress(a: Address, b: Address) {
  return a.replace('0x', '').toLowerCase() === b.replace('0x', '').toLowerCase()
}

export const privateKeyToAddress = (privateKey: string) => {
  return toChecksumAddress(
    '0x' + privateToAddress(Buffer.from(privateKey.slice(2), 'hex')).toString('hex')
  )
}

export const privateKeyToPublicKey = (privateKey: string) => {
  return toChecksumAddress(
    '0x' + privateToPublic(Buffer.from(privateKey.slice(2), 'hex')).toString('hex')
  )
}
export { toChecksumAddress } from 'ethereumjs-util'
