import { ethers } from 'ethers'
import { Parser } from './parser'

async function main() {
  const parser = new Parser(42220)
  const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org')
  if (process.argv.length > 3) {
    const txDescription = await parser.parse({
      from: '',
      to: process.argv[2],
      data: process.argv[3],
      value: process.argv[4] || 0,
    })
    console.log(parser.formatTxDescriptionToHuman(txDescription))
  } else {
    const txHash = process.argv[2]
    const tx = await provider.getTransaction(txHash)
    const txDescription = await parser.parse({
      from: tx.from,
      to: tx.to!,
      data: tx.data,
      value: tx.value,
    })
    console.log(parser.formatTxDescriptionToHuman(txDescription))
  }
}

main()
  .catch(console.error)
  .then(() => {})
