import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
// import { parseTransaction } from 'viem'
import Web3 from 'web3'
import { extractSignature, recoverTransaction, rlpEncodedTx } from './signing-utils'
const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))

describe('rlpEncodedTx', () => {
  describe('legacy', () => {
    const legacyTransaction = {
      feeCurrency: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
      from: ACCOUNT_ADDRESS1,
      to: ACCOUNT_ADDRESS1,
      chainId: 2,
      value: Web3.utils.toWei('1000', 'ether'),
      nonce: 0,
      gas: '10',
      gasPrice: '99',
      data: '0xabcdef',
    }
    it('convert CeloTx into RLP', () => {
      const transaction = {
        ...legacyTransaction,
      }
      const result = rlpEncodedTx(transaction)
      expect(result).toMatchInlineSnapshot(`
        {
          "rlpEncode": "0xf84080630a945409ed021d9299bf6814279a6a1411a7e866a6318080941be31a94361a391bbafb2a4ccd704f57dc04d4bb893635c9adc5dea0000083abcdef028080",
          "transaction": {
            "chainId": 2,
            "data": "0xabcdef",
            "feeCurrency": "0x5409ed021d9299bf6814279a6a1411a7e866a631",
            "from": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
            "gas": "0x0a",
            "gasPrice": "0x63",
            "gatewayFee": "0x",
            "gatewayFeeRecipient": "0x",
            "nonce": 0,
            "to": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
            "value": "0x3635c9adc5dea00000",
          },
        }
      `)
    })

    describe('when chainId / gasPrice / nonce is invalid', () => {
      it('chainId is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          chainId: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, gasPrice or maxFeePerGas/maxPriorityFeePerGas, nonce or chainId is lower than 0"`
        )
      })
      it('gasPrice is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          gasPrice: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, gasPrice or maxFeePerGas/maxPriorityFeePerGas, nonce or chainId is lower than 0"`
        )
      })
      it('nonce is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          nonce: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, gasPrice or maxFeePerGas/maxPriorityFeePerGas, nonce or chainId is lower than 0"`
        )
      })
      it('gas is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          gas: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, gasPrice or maxFeePerGas/maxPriorityFeePerGas, nonce or chainId is lower than 0"`
        )
      })
    })
  })

  describe('when no gas fields are provided', () => {
    it('throws an error', () => {
      expect(() => rlpEncodedTx({})).toThrowErrorMatchingInlineSnapshot(`"gas" is missing`)
    })
  })

  describe('EIP1559 / CIP42', () => {
    const eip1559Transaction = {
      from: ACCOUNT_ADDRESS1,
      to: ACCOUNT_ADDRESS1,
      chainId: 2,
      value: Web3.utils.toWei('1000', 'ether'),
      nonce: 0,
      maxFeePerGas: '10',
      maxPriorityFeePerGas: '99',
      gas: '99',
      data: '0xabcdef',
    }

    describe('when maxFeePerGas or maxPriorityFeePerGas is to low', () => {
      it('throws an error', () => {
        const transaction = {
          ...eip1559Transaction,
          maxFeePerGas: '-1',
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"maxFeePerGas" is lower than 0`
        )
      })
      it('throws an error', () => {
        const transaction = {
          ...eip1559Transaction,
          maxPriorityFeePerGas: Web3.utils.toBN('-5'),
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, gasPrice or maxFeePerGas/maxPriorityFeePerGas, nonce or chainId is lower than 0`
        )
      })
    })

    describe('when maxFeePerGas and maxPriorityFeePerGas and feeCurrency are provided', () => {
      it('orders fields in RLP as specified by CIP42', () => {
        const CIP42Transaction = {
          ...eip1559Transaction,
          feeCurrency: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
        }
        const result = rlpEncodedTx(CIP42Transaction)
        expect(result).toMatchInlineSnapshot()
      })
    })

    describe('when maxFeePerGas and maxPriorityFeePerGas are provided', () => {
      it('orders fields in RLP as specified by EIP1559', () => {
        const CIP42Transaction = {
          ...eip1559Transaction,
          feeCurrency: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
        }
        const result = rlpEncodedTx(CIP42Transaction)
        expect(result).toMatchInlineSnapshot()
      })
    })
  })
})

describe('recoverTransaction', () => {
  describe('with EIP1559 transactions', () => {
    //TODO CIP42
    // it('matches output of viem parseTransaction', () => {
    //   const encodedByCK1559TX = ''
    //   const recovered = recoverTransaction(encodedByCK1559TX)
    //   expect(recovered[0]).toEqual(parseTransaction(encodedByCK1559TX))
    // })
    it.skip('can recover (parse) transactions signed by viem', () => {
      const encodedByViem1559TX = ''
      const recovered = recoverTransaction(encodedByViem1559TX)
      expect(recovered).toMatchInlineSnapshot(``)
    })
  })
  it('handles celo-legacy transactions', () => {
    // from packages/sdk/wallets/wallet-rpc/src/rpc-wallet.test.ts:186
    const celoLegacyTx =
      '0xf86b8081991094588e4b68193001e4d10928660ab4165b813717c08a0100000000000000000083abcdef25a073bb7eaa60c810af1fad0f68fa15d4714f9990d0202b62797f6134493ec9f6fba046c13e92017228c2c8f0fae74ddd735021817f2f9757cd66debed078daf4070e'
    expect(recoverTransaction(celoLegacyTx)).toMatchInlineSnapshot()
  })
  it('handles cip42 transactions', () => {
    const cip42TX =
      '0xf86a80801094588e4b68193001e4d10928660ab4165b813717c08a0100000000000000000083abcdef26a05e9c1e7690d05f3e1433c824fbd948643ff6c618e347ea8c23a6363f3b17cdffa072dc1c22d6147be7b4b7b3cf51eb73b8bedd7940d7b668dcd7ef688a2354a631'
    expect(recoverTransaction(cip42TX)).toMatchInlineSnapshot()
  })
})

describe('extractSignature', () => {
  it('extracts from celo legacy txs', () => {
    const extracted = extractSignature(
      '0xf86b8081991094588e4b68193001e4d10928660ab4165b813717c08a0100000000000000000083abcdef25a073bb7eaa60c810af1fad0f68fa15d4714f9990d0202b62797f6134493ec9f6fba046c13e92017228c2c8f0fae74ddd735021817f2f9757cd66debed078daf4070e'
    )
    expect(extracted).toMatchInlineSnapshot()
  })
  it('extracts from cip42 txs', () => {
    const extracted = extractSignature(
      '0xf86a80801094588e4b68193001e4d10928660ab4165b813717c08a0100000000000000000083abcdef26a05e9c1e7690d05f3e1433c824fbd948643ff6c618e347ea8c23a6363f3b17cdffa072dc1c22d6147be7b4b7b3cf51eb73b8bedd7940d7b668dcd7ef688a2354a631'
    )
    expect(extracted).toMatchInlineSnapshot()
  })
  it.skip('extracts from eip1559 txs', () => {
    const extracted = extractSignature('')
    expect(extracted).toMatchInlineSnapshot()
  })
  it.skip('fails when length is wrong', () => {
    expect(() => extractSignature('')).toThrowErrorMatchingInlineSnapshot()
  })
})
