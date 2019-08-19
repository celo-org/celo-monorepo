import BN from 'bn.js'
import { Attestations } from '../generated/types/Attestations'
import { BaseWrapper } from './BaseWrapper'

export interface AttestationStat {
  completed: number
  total: number
}

export class AttestationsWrapper extends BaseWrapper<Attestations> {
  async lookupPhoneNumbers(phoneNumberHashes: string[]) {
    // Unfortunately can't be destructured
    const stats = await this.contract.methods.batchGetAttestationStats(phoneNumberHashes).call()

    const toNum = (n: string) => new BN(n).toNumber()
    const matches = stats[0].map(toNum)
    const addresses = stats[1]
    const completed = stats[2].map(toNum)
    const total = stats[3].map(toNum)
    // Map of phone hash -> (Map of address -> AttestationStat)
    const result: { [phoneHash: string]: { [address: string]: AttestationStat } | undefined } = {}

    let rIndex = 0

    for (let pIndex = 0; pIndex < phoneNumberHashes.length; pIndex++) {
      const pHash = phoneNumberHashes[pIndex]
      const numberOfMatches = matches[pIndex]
      if (numberOfMatches === 0) {
        continue
      }

      const matchingAddresses: { [address: string]: AttestationStat } = {}
      for (let mIndex = 0; mIndex < numberOfMatches; mIndex++) {
        const matchingAddress = addresses[rIndex]
        matchingAddresses[matchingAddress] = {
          completed: completed[rIndex],
          total: total[rIndex],
        }
        rIndex++
      }

      result[pHash] = matchingAddresses
    }

    return result
  }
}
