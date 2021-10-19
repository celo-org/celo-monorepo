import { ethers } from 'ethers'
import { Parser } from './parser'
// Real network tests

describe('Real transaction tests', () => {
  it('can properly decode the tx', async () => {
    const parser = new Parser(42220)
    const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org')
    const txHash = '0x13c0fb425956878519a59cb67ad0f76f2399223c84b8fe5383f005d38b75c345'
    const tx = await provider.getTransaction(txHash)
    const txDescription = await parser.parse({
      from: tx.from,
      to: tx.to!,
      data: tx.data,
      value: tx.value,
    })

    expect(parser.formatTxDescriptionToHuman(txDescription)).toEqual(
      `swapExactTokensForTokens(amountIn: 10768150309273298380, amountOutMin: 1868254991157015353, path: ["0x73a210637f6F6B7005512677Ba6B3C96bb4AA44B", "0x471EcE3750Da237f93B8E339c536989b8978a438", "0xa8d0E6799FF3Fd19c6459bf02689aE09c4d78Ba7"], to: "0x2fcE67597ffbc863dFE8Cec25cCbE80961768CE8", deadline: 1634594476)`
    )
  })
})
