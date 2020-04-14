const web3EthAbi = require('web3-eth-abi')
import { ABIDefinition, DecodedParamsObject } from 'web3-eth-abi'
import { Tx } from 'web3-core'

export const getAbiTypes = (abi: ABIDefinition[], methodName: string) =>
  abi.find((entry) => entry.name! === methodName)!.inputs!.map((input) => input.type)

export const parseDecodedParams = (params: DecodedParamsObject) => {
  const args = new Array(params.__length__)
  delete params.__length__
  Object.keys(params).forEach((key) => {
    const argIndex = parseInt(key, 10)
    if (argIndex >= 0) {
      args[argIndex] = params[key]
      delete params[key]
    }
  })
  return { args, params }
}

export const estimateGas = async (
  tx: Tx,
  gasEstimator: (tx: Tx) => Promise<number>,
  caller: (tx: Tx) => Promise<string>
) => {
  console.log('estimating gas!')
  let success = true
  let errString = ''
  try {
    const gas = await gasEstimator({ ...tx })
    return gas
  } catch (e) {
    success = false
    console.log('caught!')
    const called = await caller({ data: tx.data, to: tx.to, from: tx.from })
    console.log('called', called)
    let revertReason = 'Could not decode transaction failure reason'
    if (called.startsWith('0x08c379a')) {
      revertReason = web3EthAbi.decodeParameter('string', '0x' + called.substring(10))
    }
    errString = `Gas estimation failed:\n${revertReason}`
  }
  if (!success) {
    console.log('no success')
    // TODO(asa):
    throw errString
  }
  // Make compiler happy
  return 0
}
