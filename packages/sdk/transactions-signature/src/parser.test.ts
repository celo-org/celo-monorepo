import { ethers } from 'ethers'
import { celoAbiFetchers, ethAbiFetchers } from './abiFetcher'
import { Parser } from './parser'
// Real network tests

describe('Real transaction tests', () => {
  it('can properly decode a basic Celo TX', async () => {
    const parser = new Parser(celoAbiFetchers)
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

  it('can properly decode a Celo Core proxied TX', async () => {
    const parser = new Parser(celoAbiFetchers)
    const provider = new ethers.providers.JsonRpcProvider('https://forno.celo.org')
    const txHash = '0x3d17faf7c8e9e5fdc69570c9b620cf5eb79db2e3e3c1bb6f9f1e1cd72184aeb9'
    const tx = await provider.getTransaction(txHash)
    const txDescription = await parser.parse({
      from: tx.from,
      to: tx.to!,
      data: tx.data,
      value: tx.value,
    })

    expect(parser.formatTxDescriptionToHuman(txDescription)).toEqual(
      `approve(spender: "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121", value: 115792089237316195423570985008687907853269984665640564039457584007913129639935)`
    )
  })

  it('can decode a Ethereum proxied TX', async () => {
    const parser = new Parser(ethAbiFetchers)
    const provider = new ethers.providers.JsonRpcProvider(
      'https://mainnet-nethermind.blockscout.com/'
    )
    const txHash = '0xb87ec0c256b81be5ca98040e58f27483167c773ef38c024e71e209410f8d26b3'
    const tx = await provider.getTransaction(txHash)
    const txDescription = await parser.parse({
      from: tx.from,
      to: tx.to!,
      data: tx.data,
      value: tx.value,
    })

    expect(parser.formatTxDescriptionToHuman(txDescription)).toEqual(
      `transfer(to: \"0x4F990a64ad8B39737d69452E50baB50B5257c46a\", value: 290000000)`
    )
  })
})
