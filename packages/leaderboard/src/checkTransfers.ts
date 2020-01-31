import { ContractKit } from '@celo/contractkit'
import { readFromSheet, dedup } from './util'

function findCommon(a: string[], b: string[]) {
  return dedup(a.filter((el) => b.includes(el)).concat(b.filter((el) => a.includes(el))))
}

readFromSheet(async function(_: ContractKit, data: any) {
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const a = data[i]
      const b = data[j]
      const common = findCommon(a.claims, b.claims)
      if (common.length > 0) {
        console.log(a.address, 'and', b.address, 'have common elements', common)
      }
    }
  }
})
