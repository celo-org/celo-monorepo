import { newKit } from '@celo/contractkit/lib'
import { parseBlockExtraData } from '@celo/utils/lib/istanbul'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const table = {
  down: {},
  total: {},
  percent: {},
  name: {},
  address: {},
  signer: {},
}

function printBitmap(n: number, str: string, curStr: string, info: any = {}) {
  while (str.length < n) {
    str = '0' + str
  }
  let res = ''
  for (let i = 0; i < n; i++) {
    if (str.charAt(i) === '0') {
      res += 'X'
    } else if (curStr.charAt(i) === '0') {
      res += ','
    } else if (info[i] === -1) {
      res += 'o'
    } else {
      res += '.'
    }
  }
  return res
}

const signerInfo: { [key: string]: number } = {}
const sequenceInfo: { [key: string]: number } = {}
const maxSequenceInfo: { [key: string]: number } = {}
const minerInfo: any = {}

async function main() {
  const url = process.env.WEB3 || 'http://localhost:8545'
  const kit = newKit(url)

  const startBlock = 100
  const endBlock = 104

  let total = 0
  let maxTime = 0
  let totalSigners = 0
  const numValidators = 30

  for (let j = 0; j < numValidators; j++) {
    if (!signerInfo[j]) {
      signerInfo[j] = 0
    }
    if (!sequenceInfo[j]) {
      sequenceInfo[j] = 0
    }
    if (!maxSequenceInfo[j]) {
      maxSequenceInfo[j] = 0
    }
  }

  for (let i = startBlock; i <= endBlock; i++) {
    let bn = await kit.web3.eth.getBlockNumber()
    while (bn - 1 < i) {
      await sleep(1000)
      bn = await kit.web3.eth.getBlockNumber()
    }
    const nextBlock = await kit.web3.eth.getBlock(i + 1)
    const bitmap = parseBlockExtraData(nextBlock.extraData).parentAggregatedSeal.bitmap
    const binary = bitmap.toString(2)
    const block = await kit.web3.eth.getBlock(i)
    const curBitmap = parseBlockExtraData(block.extraData).aggregatedSeal.bitmap
    const curBinary = curBitmap.toString(2)

    if (!minerInfo[nextBlock.miner]) {
      minerInfo[nextBlock.miner] = 0
    }
    minerInfo[nextBlock.miner]++
    for (let j = 0; j < numValidators; j++) {
      if (binary.charAt(j) === '0') {
        signerInfo[j]++
        sequenceInfo[j]++
      }
      if (binary.charAt(j) === '1') {
        totalSigners++
      }
      maxSequenceInfo[j] = Math.max(maxSequenceInfo[j], sequenceInfo[j])
    }
    const blockTime = Number(nextBlock.timestamp) - Number(block.timestamp)
    total += blockTime
    maxTime = Math.max(maxTime, blockTime)
    console.info(`${i} ${printBitmap(numValidators, binary, curBinary)} ${blockTime}`)
  }
  const maxSeqMisses = Object.values(maxSequenceInfo).reduce((a, b) => Math.max(a, b), 0)
  const maxMisses = Object.values(signerInfo).reduce((a, b) => Math.max(a, b), 0)
  const numBlocks = endBlock - startBlock + 1
  console.info('average block time', total / numBlocks)
  console.info('max block time', maxTime)
  console.info('average signers', totalSigners / (numBlocks * numValidators))
  console.info('max misses', maxMisses)
  console.info('max sequential misses', maxSeqMisses)
  process.exit()
}

// tslint:disable-next-line: no-floating-promises
main()
