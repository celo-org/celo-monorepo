import { CeloTx } from '../types'
import { inputAccessListFormatter, inputCeloTxFormatter, outputCeloTxFormatter } from './formatter'

describe('inputAccessListFormatter', () => {
  test('with valid accessList', () => {
    const accessList = [
      {
        address: '0x0000000000000000000000000000000000000000',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      },
    ]

    expect(inputAccessListFormatter(accessList)).toEqual([
      [
        '0x0000000000000000000000000000000000000000',
        [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      ],
    ])
  })
})

describe('inputCeloTxFormatter', () => {
  const base: CeloTx = {
    chainId: 42220,
    nonce: 1,
    gas: 1000000,
    value: '0x0241',
    from: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
    to: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
    data: '0x',
  }
  describe('when address does not pass checksum', () => {
    ;['from', 'to', 'feeCurrency'].forEach((property) => {
      test(`${property}`, () => {
        const faulty = { ...base, [property]: '0x3e8' }
        expect(() => inputCeloTxFormatter(faulty)).toThrowError(
          `Provided address 0x3e8 is invalid, the capitalization checksum test failed`
        )
      })
    })
  })

  describe('valid celo-legacy tx', () => {
    const legacy = {
      ...base,
      gasPrice: '0x3e8',
      feeCurrency: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
    }
    it('formats', () => {
      expect(inputCeloTxFormatter(legacy)).toMatchInlineSnapshot(`
        {
          "data": "0x",
          "feeCurrency": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "from": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "gas": "0xf4240",
          "gasPrice": "0x3e8",
          "nonce": "0x1",
          "to": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "value": "0x241",
        }
      `)
    })
  })
  describe('valid cip42 tx', () => {
    const cip42 = {
      ...base,
      maxFeePerGas: '0x3e8',
      maxPriorityFeePerGas: '0x3e8',
      feeCurrency: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
    }
    it('formats', () => {
      expect(inputCeloTxFormatter(cip42)).toMatchInlineSnapshot(`
        {
          "data": "0x",
          "feeCurrency": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "from": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "gas": "0xf4240",
          "maxFeePerGas": "0x3e8",
          "maxPriorityFeePerGas": "0x3e8",
          "nonce": "0x1",
          "to": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "value": "0x241",
        }
      `)
    })
  })
  describe('valid eip1559 tx', () => {
    const eip1559 = {
      ...base,
      maxFeePerGas: '0x3e8',
      maxPriorityFeePerGas: '0x3e8',
    }
    it('formats', () => {
      expect(inputCeloTxFormatter(eip1559)).toMatchInlineSnapshot(`
        {
          "data": "0x",
          "from": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "gas": "0xf4240",
          "maxFeePerGas": "0x3e8",
          "maxPriorityFeePerGas": "0x3e8",
          "nonce": "0x1",
          "to": "0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae",
          "value": "0x241",
        }
      `)
    })
  })
})

describe('outputCeloTxFormatter', () => {
  const base = {
    nonce: '0x4',
    data: '0x',
    input: '0x3454645634534',
    from: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
    to: '0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae',
    value: '0x3e8',
    gas: '0x3e8',
    transactionIndex: '0x1',
    blockNumber: '0x3e8',
    blockHash: '0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9',
  }
  describe('with blockNumber', () => {
    test('when valid', () => {
      expect(outputCeloTxFormatter({ ...base, blockNumber: '0x1' })).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": 1,
          "data": "0x",
          "from": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "gas": 1000,
          "input": "0x3454645634534",
          "nonce": 4,
          "to": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
    test('when invalid', () => {
      expect(outputCeloTxFormatter({ ...base, blockNumber: null })).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": null,
          "data": "0x",
          "from": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "gas": 1000,
          "input": "0x3454645634534",
          "nonce": 4,
          "to": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
  })
  describe('with valid celo-legacy tx', () => {
    const legacy = {
      ...base,
      gasPrice: '0x3e8',
    }
    test('when valid', () => {
      expect(outputCeloTxFormatter(legacy)).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": 1000,
          "data": "0x",
          "from": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "gas": 1000,
          "gasPrice": "1000",
          "input": "0x3454645634534",
          "nonce": 4,
          "to": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
  })
  describe('with valid cip42 tx', () => {
    const cip42 = {
      ...base,
      gateWayFee: '0x3e8',
      feeCurrency: '0x11f4d0a3c12e86b4b5f39b213f7e19d048276dae',
      maxFeePerGas: '0x3e8',
      maxPriorityFeePerGas: '0x3e8',
    }
    test('when valid', () => {
      expect(outputCeloTxFormatter(cip42)).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": 1000,
          "data": "0x",
          "feeCurrency": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "from": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "gas": 1000,
          "gateWayFee": "0x3e8",
          "input": "0x3454645634534",
          "maxFeePerGas": "1000",
          "maxPriorityFeePerGas": "1000",
          "nonce": 4,
          "to": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
  })
  describe('with valid eip1559 tx', () => {
    const eip1559 = {
      ...base,
      maxFeePerGas: '0x3e8',
      maxPriorityFeePerGas: '0x3e8',
    }
    test('when valid', () => {
      expect(outputCeloTxFormatter(eip1559)).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": 1000,
          "data": "0x",
          "from": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "gas": 1000,
          "input": "0x3454645634534",
          "maxFeePerGas": "1000",
          "maxPriorityFeePerGas": "1000",
          "nonce": 4,
          "to": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
  })
  describe('when properties are missing', () => {
    test('without from', () => {
      expect(outputCeloTxFormatter({ ...base, from: null })).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": 1000,
          "data": "0x",
          "from": null,
          "gas": 1000,
          "input": "0x3454645634534",
          "nonce": 4,
          "to": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
    test('without to', () => {
      expect(outputCeloTxFormatter({ ...base, to: null })).toMatchInlineSnapshot(`
        {
          "blockHash": "0xc9b9cdc2092a9d6589d96662b1fd6949611163fb3910cf8a173cd060f17702f9",
          "blockNumber": 1000,
          "data": "0x",
          "from": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
          "gas": 1000,
          "input": "0x3454645634534",
          "nonce": 4,
          "to": null,
          "transactionIndex": 1,
          "value": "1000",
        }
      `)
    })
  })
})
