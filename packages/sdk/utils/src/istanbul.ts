import { bufferToHex, toChecksumAddress } from '@ethereumjs/util'
import BigNumber from 'bignumber.js'
import * as rlp from 'rlp'
import { Address } from './address'

// This file contains utilities that help with istanbul-specific block information.
// See https://github.com/celo-org/celo-blockchain/blob/master/core/types/istanbul.go

const ISTANBUL_EXTRA_VANITY_BYTES = 32

export type Bitmap = BigNumber

// Aggregated BLS signatures for a block.
export interface Seal {
  bitmap: Bitmap
  signature: string
  round: BigNumber
}

// Extra data in the block header to support Istanbul BFT.
export interface IstanbulExtra {
  addedValidators: Address[]
  addedValidatorsPublicKeys: string[]
  removedValidators: Bitmap
  seal: string
  aggregatedSeal: Seal
  parentAggregatedSeal: Seal
}

function bigNumberFromBuffer(data: Buffer): BigNumber {
  return new BigNumber('0x' + (data.toString('hex') || '0'), 16)
}

function sealFromBuffers(data: Buffer[]): Seal {
  return {
    bitmap: bigNumberFromBuffer(data[0]),
    signature: '0x' + data[1].toString('hex'),
    round: bigNumberFromBuffer(data[2]),
  }
}

// Parse RLP encoded block extra data into an IstanbulExtra object.
export function parseBlockExtraData(data: string): IstanbulExtra {
  const buffer = Buffer.from(data.replace(/^0x/, ''), 'hex')
  const decode: any = rlp.decode('0x' + buffer.slice(ISTANBUL_EXTRA_VANITY_BYTES).toString('hex'))
  return {
    addedValidators: decode[0].map((addr: Buffer) => toChecksumAddress(bufferToHex(addr))),
    addedValidatorsPublicKeys: decode[1].map((key: Buffer) => '0x' + key.toString('hex')),
    removedValidators: bigNumberFromBuffer(decode[2]),
    seal: '0x' + decode[3].toString('hex'),
    aggregatedSeal: sealFromBuffers(decode[4]),
    parentAggregatedSeal: sealFromBuffers(decode[5]),
  }
}

export function bitIsSet(bitmap: Bitmap, index: number): boolean {
  if (index < 0) {
    throw new Error(`bit index must be greater than zero: got ${index}`)
  }
  return bitmap
    .idiv('1' + '0'.repeat(index), 2)
    .mod(2)
    .gt(0)
}

export const IstanbulUtils = {
  parseBlockExtraData,
  bitIsSet,
}
