import { CeloTx } from '@celo/connect'
import { normalizeAddressWith0x, privateKeyToAddress } from '@celo/utils/lib/address'
import { parseTransaction, serializeTransaction } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import Web3 from 'web3'
import {
  extractSignature,
  getSignerFromTxCIP42,
  isPriceToLow,
  recoverTransaction,
  rlpEncodedTx,
  stringNumberOrBNToHex,
} from './signing-utils'
const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1)) as `0x${string}`

describe('rlpEncodedTx', () => {
  describe('legacy', () => {
    const legacyTransaction = {
      feeCurrency: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
      from: ACCOUNT_ADDRESS1,
      to: ACCOUNT_ADDRESS1,
      chainId: 2,
      value: Web3.utils.toWei('1000', 'ether'),
      nonce: 1,
      gas: '1500000000',
      gasPrice: '9900000000',
      data: '0xabcdef',
    }
    it('convert CeloTx into RLP', () => {
      const transaction = {
        ...legacyTransaction,
      }
      const result = rlpEncodedTx(transaction)
      expect(result).toMatchInlineSnapshot(`
        {
          "rlpEncode": "0xf8490185024e1603008459682f00945409ed021d9299bf6814279a6a1411a7e866a6318080941be31a94361a391bbafb2a4ccd704f57dc04d4bb893635c9adc5dea0000083abcdef028080",
          "transaction": {
            "chainId": 2,
            "data": "0xabcdef",
            "feeCurrency": "0x5409ed021d9299bf6814279a6a1411a7e866a631",
            "from": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
            "gas": "0x59682f00",
            "gasPrice": "0x024e160300",
            "gatewayFee": "0x",
            "gatewayFeeRecipient": "0x",
            "maxFeePerGas": "0x",
            "maxPriorityFeePerGas": "0x",
            "nonce": 1,
            "to": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
            "value": "0x3635c9adc5dea00000",
          },
          "type": "celo-legacy",
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
          `"Gas, nonce or chainId is less than than 0"`
        )
      })
      it('gasPrice is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          gasPrice: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0"`
        )
      })
      it('nonce is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          nonce: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, nonce or chainId is less than than 0"`
        )
      })
      it('gas is not a positive number it throws error', () => {
        const transaction = {
          ...legacyTransaction,
          gas: -1,
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"Gas, nonce or chainId is less than than 0"`
        )
      })
    })
  })

  describe('when no gas fields are provided', () => {
    it('throws an error', () => {
      expect(() => rlpEncodedTx({})).toThrowErrorMatchingInlineSnapshot(`""gas" is missing"`)
    })
  })

  describe('EIP1559 / CIP42', () => {
    const eip1559Transaction: CeloTx = {
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

    describe('when maxFeePerGas is to low', () => {
      it('throws an error', () => {
        const transaction = {
          ...eip1559Transaction,
          maxFeePerGas: Web3.utils.toBN('-5'),
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0"`
        )
      })
    })
    describe('when maxPriorityFeePerGas is to low', () => {
      it('throws an error', () => {
        const transaction = {
          ...eip1559Transaction,
          maxPriorityFeePerGas: Web3.utils.toBN('-5'),
        }
        expect(() => rlpEncodedTx(transaction)).toThrowErrorMatchingInlineSnapshot(
          `"GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0"`
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
        expect(result).toMatchInlineSnapshot(`
          {
            "rlpEncode": "0x7cf8400280630a63945409ed021d9299bf6814279a6a1411a7e866a6318080941be31a94361a391bbafb2a4ccd704f57dc04d4bb893635c9adc5dea0000083abcdefc0",
            "transaction": {
              "chainId": 2,
              "data": "0xabcdef",
              "feeCurrency": "0x5409ed021d9299bf6814279a6a1411a7e866a631",
              "from": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
              "gas": "0x63",
              "gasPrice": "0x",
              "gatewayFee": "0x",
              "gatewayFeeRecipient": "0x",
              "maxFeePerGas": "0x0a",
              "maxPriorityFeePerGas": "0x63",
              "nonce": 0,
              "to": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
              "value": "0x3635c9adc5dea00000",
            },
            "type": "cip42",
          }
        `)
      })
    })

    describe('when maxFeePerGas and maxPriorityFeePerGas are provided', () => {
      it('orders fields in RLP as specified by EIP1559', () => {
        const CIP42Transaction = {
          ...eip1559Transaction,
          feeCurrency: '0x5409ED021D9299bf6814279A6A1411A7e866A631',
        }
        const result = rlpEncodedTx(CIP42Transaction)
        expect(result).toMatchInlineSnapshot(`
          {
            "rlpEncode": "0x7cf8400280630a63945409ed021d9299bf6814279a6a1411a7e866a6318080941be31a94361a391bbafb2a4ccd704f57dc04d4bb893635c9adc5dea0000083abcdefc0",
            "transaction": {
              "chainId": 2,
              "data": "0xabcdef",
              "feeCurrency": "0x5409ed021d9299bf6814279a6a1411a7e866a631",
              "from": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
              "gas": "0x63",
              "gasPrice": "0x",
              "gatewayFee": "0x",
              "gatewayFeeRecipient": "0x",
              "maxFeePerGas": "0x0a",
              "maxPriorityFeePerGas": "0x63",
              "nonce": 0,
              "to": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
              "value": "0x3635c9adc5dea00000",
            },
            "type": "cip42",
          }
        `)
      })
    })
  })
  describe('compared to viem', () => {
    it('matches output of viem serializeTransaction with accessList', () => {
      const tx = {
        type: 'eip1559' as const,
        from: ACCOUNT_ADDRESS1,
        to: ACCOUNT_ADDRESS1,
        chainId: 2,
        value: Web3.utils.toWei('1000', 'ether'),
        nonce: 0,
        maxFeePerGas: '1000',
        maxPriorityFeePerGas: '99',
        gas: '9900',
        data: '0xabcdef' as const,
        accessList: [
          {
            address: '0x0000000000000000000000000000000000000000' as const,
            storageKeys: [
              '0x0000000000000000000000000000000000000000000000000000000000000001' as const,
              '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe' as const,
            ],
          },
        ],
      }
      const txViem = {
        ...tx,
        gas: BigInt(tx.gas),
        maxFeePerGas: BigInt(tx.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
        value: BigInt(tx.value),
      }
      const viemSerialized = serializeTransaction(txViem)
      const serialized = rlpEncodedTx(tx)

      const parsedCK = parseTransaction(serialized.rlpEncode)
      const parsedViem = parseTransaction(viemSerialized)
      expect(parsedCK).toEqual(parsedViem)
      expect(serialized.rlpEncode).toEqual(viemSerialized)
    })
    it('matches output of viem serializeTransaction without accessList', () => {
      const tx = {
        type: 'eip1559' as const,
        from: ACCOUNT_ADDRESS1,
        to: ACCOUNT_ADDRESS1,
        chainId: 2,
        value: Web3.utils.toWei('1000', 'ether'),
        nonce: 0,
        maxFeePerGas: '1000',
        maxPriorityFeePerGas: '99',
        gas: '9900',
        data: '0xabcdef' as const,
      }
      const txViem = {
        ...tx,
        gas: BigInt(tx.gas),
        maxFeePerGas: BigInt(tx.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas),
        value: BigInt(tx.value),
      }
      const viemSerialized = serializeTransaction(txViem)
      const serialized = rlpEncodedTx(tx)

      const parsedCK = parseTransaction(serialized.rlpEncode)
      const parsedViem = parseTransaction(viemSerialized)
      expect(parsedCK).toEqual(parsedViem)
      expect(serialized.rlpEncode).toEqual(viemSerialized)
    })
  })
})

function ckToViem(tx: CeloTx) {
  return {
    ...tx,
    gas: BigInt(tx.gas!),
    maxFeePerGas: BigInt(tx.maxFeePerGas?.toString()!),
    maxPriorityFeePerGas: BigInt(tx.maxPriorityFeePerGas?.toString()!),
    value: BigInt(tx.value?.toString()!),
    // @ts-expect-error
    v: BigInt(tx.v?.toString()! === '0x' ? 0 : tx.v?.toString()!),
  }
}

describe('recoverTransaction', () => {
  const ACCOUNT_ADDRESS1 = privateKeyToAddress(PRIVATE_KEY1)
  describe('with EIP1559 transactions', () => {
    test('ok', async () => {
      const account = privateKeyToAccount(PRIVATE_KEY1)
      const hash = await account.signTransaction({
        type: 'eip1559' as const,
        from: ACCOUNT_ADDRESS1,
        to: ACCOUNT_ADDRESS1 as `0x${string}`,
        chainId: 2,
        value: BigInt(1000),
        nonce: 0,
        maxFeePerGas: BigInt('1000'),
        maxPriorityFeePerGas: BigInt('99'),
        gas: BigInt('9900'),
        data: '0xabcdef' as const,
      })

      const [transaction, signer] = recoverTransaction(hash)
      expect(signer).toEqual(ACCOUNT_ADDRESS1)
      expect(transaction).toMatchInlineSnapshot(`
        {
          "accessList": [],
          "chainId": 2,
          "data": "0xabcdef",
          "gas": 9900,
          "maxFeePerGas": 1000,
          "maxPriorityFeePerGas": 99,
          "nonce": 0,
          "r": "0x04ddb2c87a6e0f77aa25da7439c72f978541f74fa1bd20becf2e109301d2f85c",
          "s": "0x2d91eec5c0abca75d4df8322677bf43306e90172b77914494bbb7641b6dfc7e9",
          "to": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
          "type": "eip1559",
          "v": 28,
          "value": 1000,
          "yParity": 1,
        }
      `)
    })

    it('matches output of viem parseTransaction', () => {
      const encodedByCK1559TX =
        // from packages/sdk/wallets/wallet-local/src/local-wallet.test.ts:211 -- when calling signTransaction succeeds with eip1559
        '0x02f86d82ad5a8063630a94588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdefc080a02c61b97c545c0a59732adbc497e944818da323a508930996383751d17e0b932ea015666dce65f074f12335ab78e1912f8b83fda75f05a002943459598712e6b17c'
      const [transaction, signer] = recoverTransaction(encodedByCK1559TX)
      const parsed = parseTransaction(encodedByCK1559TX)

      expect(ckToViem(transaction)).toMatchObject(parsed)
      expect(signer).toMatchInlineSnapshot(`"0x1Be31A94361a391bBaFB2a4CCd704F57dc04d4bb"`)
    })
    it('can recover (parse) transactions signed by viem', () => {
      // stolen from viems's default eip1559 test result viem/src/accounts/utils/signTransaction.test.ts
      const encodedByViem1559TX =
        '0x02f850018203118080825208808080c080a04012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1a04e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33'
      const recovered = recoverTransaction(encodedByViem1559TX)
      expect(recovered).toMatchInlineSnapshot(`
        [
          {
            "accessList": [],
            "chainId": 1,
            "data": "0x",
            "gas": 21000,
            "maxFeePerGas": 0,
            "maxPriorityFeePerGas": 0,
            "nonce": 785,
            "r": "0x4012522854168b27e5dc3d5839bab5e6b39e1a0ffd343901ce1622e3d64b48f1",
            "s": "0x4e00902ae0502c4728cbf12156290df99c3ed7de85b1dbfe20b5c36931733a33",
            "to": "0x",
            "type": "eip1559",
            "v": 27,
            "value": 0,
            "yParity": 0,
          },
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        ]
      `)
    })
  })
  it('handles celo-legacy transactions', () => {
    const celoLegacyTx =
      '0xf88480630a80941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdef83015ad8a09e121a99dc0832a9f4d1d71500b3c8a69a3c064d437c225d6292577ffcc45a71a02c5efa3c4b58953c35968e42d11d3882dacacf45402ee802824268b7cd60daff'
    expect(recoverTransaction(celoLegacyTx)).toMatchInlineSnapshot(`
      [
        {
          "chainId": "0xad5a",
          "data": "0xabcdef",
          "feeCurrency": "0x",
          "gas": 10,
          "gasPrice": 99,
          "gatewayFee": "0x5678",
          "gatewayFeeRecipient": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
          "nonce": 0,
          "to": "0x588e4b68193001e4d10928660ab4165b813717c0",
          "type": "celo-legacy",
          "value": "0x0de0b6b3a7640000",
        },
        "0x1Be31A94361a391bBaFB2a4CCd704F57dc04d4bb",
      ]
    `)
  })
  it('handles cip42 transactions', () => {
    const cip42TX =
      '0x7cf89a82ad5a8063630a94cd2a3d9f938e13cd947ec05abc7fe734df8dd826941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdefc01ba0c610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1a01799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112'
    expect(recoverTransaction(cip42TX)).toMatchInlineSnapshot(`
      [
        {
          "accessList": [],
          "chainId": 44378,
          "data": "0xabcdef",
          "feeCurrency": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826",
          "gas": 10,
          "gatewayFee": "0x5678",
          "gatewayFeeRecipient": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
          "maxFeePerGas": 99,
          "maxPriorityFeePerGas": 99,
          "nonce": 0,
          "r": "0xc610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1",
          "s": "0x1799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112",
          "to": "0x588e4b68193001e4d10928660ab4165b813717c0",
          "type": "cip42",
          "v": 28,
          "value": 1000000000000000000,
          "yParity": 1,
        },
        "0x90AB065B949165c47Acac34cA9A43171bBeBb1E1",
      ]
    `)
  })
  test('cip42 serialized by viem', async () => {
    const account = privateKeyToAccount(PRIVATE_KEY1)
    const signed = await account.signTransaction(
      {
        // @ts-ignore
        type: 'cip42',
        accessList: [],
        chainId: 44378,
        data: '0xabcdef',
        feeCurrency: '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826',
        gas: BigInt(10),
        gatewayFee: BigInt('0x5678'),
        gatewayFeeRecipient: '0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb',
        maxFeePerGas: BigInt(99),
        maxPriorityFeePerGas: BigInt(99),
        nonce: 0,
        to: '0x588e4b68193001e4d10928660ab4165b813717c0',
        value: BigInt(1000000000000000000),
      },
      { serializer: celo.serializers?.transaction }
    )

    expect(recoverTransaction(signed)).toMatchInlineSnapshot(`
      [
        {
          "accessList": [],
          "chainId": 44378,
          "data": "0xabcdef",
          "feeCurrency": "0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826",
          "gas": 10,
          "gatewayFee": "0x5678",
          "gatewayFeeRecipient": "0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb",
          "maxFeePerGas": 99,
          "maxPriorityFeePerGas": 99,
          "nonce": 0,
          "r": "0xc610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1",
          "s": "0x1799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112",
          "to": "0x588e4b68193001e4d10928660ab4165b813717c0",
          "type": "cip42",
          "v": 27,
          "value": 1000000000000000000,
          "yParity": 0,
        },
        "0x1Be31A94361a391bBaFB2a4CCd704F57dc04d4bb",
      ]
    `)
    // expect(recoverTransaction(signed)[1]).toEqual(account.address)
  })
})

describe('isPriceToLow', () => {
  test('maxFee and maxPriorityFee are positive', () => {
    expect(
      isPriceToLow({
        maxFeePerGas: 1_000_000_000,
        maxPriorityFeePerGas: Web3.utils.toBN('50000000000000'),
        gasPrice: undefined,
      })
    ).toBe(false)
  })
  test('gasPrice is positive', () => {
    expect(
      isPriceToLow({
        gasPrice: Web3.utils.toBN('50000000000000'),
      })
    ).toBe(false)
  })
  test('maxFeePerGas is less than 0 but maxPriorityFeePerGas is positive ', () => {
    expect(() =>
      isPriceToLow({
        maxFeePerGas: -1,
        maxPriorityFeePerGas: 1_000_000_000,
        gasPrice: undefined,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0"`
    )
  })
  test('maxPriorityFeePerGas is less than 0 but maxFeePerGas is positive ', () => {
    expect(() =>
      isPriceToLow({
        maxFeePerGas: 1_000_000_000,
        maxPriorityFeePerGas: -1_000_000_000,
        gasPrice: undefined,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0"`
    )
  })
  test('gasPrice is less than 0', () => {
    expect(() =>
      isPriceToLow({
        maxFeePerGas: '0x',
        maxPriorityFeePerGas: '0x',
        gasPrice: -1,
      })
    ).toThrowErrorMatchingInlineSnapshot(
      `"GasPrice or maxFeePerGas or maxPriorityFeePerGas is less than than 0"`
    )
  })
})

describe('extractSignature', () => {
  it('extracts from celo legacy txs', () => {
    // packages/sdk/wallets/wallet-local/src/local-wallet.test.ts:176 (succeeds with legacy)
    const extracted = extractSignature(
      '0xf88480630a80941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdef83015ad8a09e121a99dc0832a9f4d1d71500b3c8a69a3c064d437c225d6292577ffcc45a71a02c5efa3c4b58953c35968e42d11d3882dacacf45402ee802824268b7cd60daff'
    )
    expect(extracted).toMatchInlineSnapshot(`
      {
        "r": "0x9e121a99dc0832a9f4d1d71500b3c8a69a3c064d437c225d6292577ffcc45a71",
        "s": "0x2c5efa3c4b58953c35968e42d11d3882dacacf45402ee802824268b7cd60daff",
        "v": "0x015ad8",
      }
    `)
  })
  it('extracts from cip42 txs', () => {
    // packages/sdk/wallets/wallet-local/src/local-wallet.test.ts:274 (succeeds with cip42)
    const extracted = extractSignature(
      '0x7cf89a82ad5a8063630a94cd2a3d9f938e13cd947ec05abc7fe734df8dd826941be31a94361a391bbafb2a4ccd704f57dc04d4bb82567894588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdefc01ba0c610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1a01799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112'
    )
    expect(extracted).toMatchInlineSnapshot(`
      {
        "r": "0xc610507b2ac3cff80dd7017419021196807d605efce0970c18cde48db33c27d1",
        "s": "0x1799477e0f601f554f0ee6f7ac21490602124801e9f7a99d9605249b90f03112",
        "v": "0x1b",
      }
    `)
  })
  it('extracts from eip1559 txs', () => {
    // packages/sdk/wallets/wallet-local/src/local-wallet.test.ts:209 ( succeeds with eip1559)
    const extracted = extractSignature(
      '0x02f87082ad5a8063630a94588e4b68193001e4d10928660ab4165b813717c0880de0b6b3a764000083abcdef8083015ad7a00fd2d0c579a971ebc04207d8c5ff5bb3449052f0c9e946a7146e5ae4d4ec6289a0737423de64cc81a62e700b5ca7970212aaed3d28de4dbce8b054483d361f6ff8'
    )
    expect(extracted).toMatchInlineSnapshot(`
      {
        "r": "0x0fd2d0c579a971ebc04207d8c5ff5bb3449052f0c9e946a7146e5ae4d4ec6289",
        "s": "0x737423de64cc81a62e700b5ca7970212aaed3d28de4dbce8b054483d361f6ff8",
        "v": "0x015ad7",
      }
    `)
  })
  it('fails when length is wrong', () => {
    expect(() => extractSignature('0x')).toThrowErrorMatchingInlineSnapshot(
      `"@extractSignature: provided transaction has 0 elements but celo-legacy txs with a signature have 12 []"`
    )
  })
})

describe('getSignerFromTx', () => {
  const account = privateKeyToAccount(PRIVATE_KEY1)
  test('extracts signer address from cip42 tx signed by viem', async () => {
    const signed = await account.signTransaction(
      {
        // @ts-ignore
        type: 'cip42',
        accessList: [],
        chainId: 44378,
        data: '0xabcdef',
        feeCurrency: '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826',
        gas: BigInt(10),
        gatewayFee: BigInt('0x5678'),
        gatewayFeeRecipient: '0x1be31a94361a391bbafb2a4ccd704f57dc04d4bb',
        maxFeePerGas: BigInt(99),
        maxPriorityFeePerGas: BigInt(99),
        nonce: 0,
        to: '0x588e4b68193001e4d10928660ab4165b813717c0',
        value: BigInt(1000000000000000000),
      },
      { serializer: celo.serializers?.transaction }
    )
    expect(getSignerFromTxCIP42(signed)).toEqual(account.address)
  })
})

describe('stringNumberOrBNToHex', () => {
  test('string as base 10 number', () => {
    expect(stringNumberOrBNToHex('1230000000000020')).toEqual('0x045eadb112e014')
    expect(stringNumberOrBNToHex('123')).toEqual('0x7b')
  })
  test('string as base 16 number', () => {
    expect(stringNumberOrBNToHex('0x7b')).toEqual('0x7b')
  })
  test('number', () => {
    expect(stringNumberOrBNToHex(1230000000000020)).toEqual('0x045eadb112e014')
    expect(stringNumberOrBNToHex(123)).toEqual('0x7b')
  })
  test('BN', () => {
    const biggie = Web3.utils.toBN('123')
    expect(stringNumberOrBNToHex(biggie)).toEqual('0x7b')
  })
})
