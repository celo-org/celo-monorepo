import BigNumber from 'bignumber.js'
import { Attestations } from '../generated/types/Attestations'
import { BaseWrapper, proxyCall, proxySend, toBigNumber } from './BaseWrapper'

export interface AttestationStat {
  completed: number
  total: number
}

export interface AttestationsToken {
  address: string
  fee: BigNumber
}

export interface AttestationsConfig {
  attestationExpirySeconds: BigNumber
  attestationRequestFees: AttestationsToken[]
}

/**
 * Contract for managing identities
 */
export class AttestationsWrapper extends BaseWrapper<Attestations> {
  setAccountDataEncryptionKey = proxySend(
    this.kit,
    this.contract.methods.setAccountDataEncryptionKey
  )
  attestationExpirySeconds = proxyCall(
    this.contract.methods.attestationExpirySeconds,
    undefined,
    toBigNumber
  )
  attestationRequestFees = proxyCall(
    this.contract.methods.attestationRequestFees,
    undefined,
    toBigNumber
  )

  async getConfig(): Promise<AttestationsConfig> {
    const evs = await this.contract.getPastEvents('AttestationRequestFeeSet', { fromBlock: 0 })
    const tokenMap: any = {}
    const tokens: string[] = []
    evs.forEach((el) => {
      const res: string = el.returnValues.token
      if (tokenMap[res]) {
        return
      }
      tokenMap[res] = true
      tokens.push(res)
    })
    const fees = await Promise.all(
      tokens.map(async (token) => {
        const fee = await this.attestationRequestFees(token)
        return { fee, address: token }
      })
    )
    return {
      attestationExpirySeconds: await this.attestationExpirySeconds(),
      attestationRequestFees: fees,
    }
  }

  async lookupPhoneNumbers(
    phoneNumberHashes: string[]
  ): Promise<Record<string, Record<string, AttestationStat>>> {
    // Unfortunately can't be destructured
    const stats = await this.contract.methods.batchGetAttestationStats(phoneNumberHashes).call()

    const toNum = (n: string) => new BigNumber(n).toNumber()
    const matches = stats[0].map(toNum)
    const addresses = stats[1]
    const completed = stats[2].map(toNum)
    const total = stats[3].map(toNum)
    // Map of phone hash -> (Map of address -> AttestationStat)
    const result: Record<string, Record<string, AttestationStat>> = {}

    let rIndex = 0

    for (let pIndex = 0; pIndex < phoneNumberHashes.length; pIndex++) {
      const pHash = phoneNumberHashes[pIndex]
      const numberOfMatches = matches[pIndex]
      if (numberOfMatches === 0) {
        continue
      }

      const matchingAddresses: Record<string, AttestationStat> = {}
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
