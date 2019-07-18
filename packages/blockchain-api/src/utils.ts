/* tslint:disable:no-console */
import * as utf8 from 'utf8'
import coder from 'web3-eth-abi'

export function randomTimestamp() {
  const start = new Date(2018, 0, 1)
  const end = new Date()
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export function randomAddr() {
  const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let randomString = '0x'
  let randomPoz
  for (let i = 0; i < 40; i++) {
    randomPoz = Math.floor(Math.random() * charSet.length)
    randomString += charSet.substring(randomPoz, randomPoz + 1)
  }
  return randomString
}

export function formatCommentString(functionCallHex: string): string {
  // '0xe1d6aceb' is the function selector for the transfer with comment function
  if (functionCallHex.length < 10 || functionCallHex.slice(0, 10) !== '0xe1d6aceb') {
    return ''
  }
  let comment
  try {
    const data = '0x' + functionCallHex.slice(10)
    comment = coder.decodeParameters(['address', 'uint256', 'string'], data)[2]
    return utf8.decode(comment)
  } catch (e) {
    // TODO: add logging to blockchain-api
    console.log(`Error decoding comment ${functionCallHex}: ${e.message}`)
    return ''
  }
}
