import BigNumber from 'bignumber.js'
import { bitIsSet, Bitmap, IstanbulExtra, parseBlockExtraData } from './istanbul'

describe('Istanbul utilities', () => {
  describe('parseBlockExtraData', () => {
    const testExtraData =
      '0xd983010817846765746888676f312e31312e358664617277696e000000000000f90127d594fd0893e334' +
      'c6401188ae77072546979b94d91813f862b8604fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36' +
      'a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053' +
      'cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff0001b84188022a71c12a801a4318e2' +
      '7eeb5c82aa923160632c63b0eae4457ed120356ddb549fb7c4e4865728478aa61c19b9abe10ec7db34c866' +
      '2b003b139188e99edcd400f30db040c083f6b6e29a6a2cab4498f50d37d458a2458b5438c9faeae8598cd4' +
      '7f4ed6e17ca10e1f87c6faa14d5e3e393f0e0080f30db06107252c187052f8212ef5cfc9052fe59c7af040' +
      'e77a09b762fd51060220511e93d1c681be8883043f8a93ea637492818080'

    const expected: IstanbulExtra = {
      addedValidators: ['0xFd0893E334C6401188Ae77072546979B94d91813'],
      addedValidatorsPublicKeys: [
        '0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00',
      ],
      removedValidators: new BigNumber(1),
      seal:
        '0x88022a71c12a801a4318e27eeb5c82aa923160632c63b0eae4457ed120356ddb549fb7c4e4865728478aa61c19b9abe10ec7db34c8662b003b139188e99edcd400',
      aggregatedSeal: {
        bitmap: new BigNumber(13),
        signature:
          '0x40c083f6b6e29a6a2cab4498f50d37d458a2458b5438c9faeae8598cd47f4ed6e17ca10e1f87c6faa14d5e3e393f0e00',
        round: new BigNumber(0),
      },
      parentAggregatedSeal: {
        bitmap: new BigNumber(13),
        signature:
          '0x6107252c187052f8212ef5cfc9052fe59c7af040e77a09b762fd51060220511e93d1c681be8883043f8a93ea63749281',
        round: new BigNumber(0),
      },
    }

    it('should decode the Istanbul extra data correctly', () => {
      expect(parseBlockExtraData(testExtraData)).toEqual(expected)
    })
  })

  describe('bitIsSet', () => {
    const testBitmap: Bitmap = new BigNumber('0x40d1', 16)
    const testBitmapAsBinary = ('0100' + '0000' + '1101' + '0001')
      .split('')
      .map((b) => b === '1')
      .reverse()

    it('should correctly identify set bits within expected index', () => {
      for (let i = 0; i < testBitmapAsBinary.length; i++) {
        expect(bitIsSet(testBitmap, i)).toBe(testBitmapAsBinary[i])
      }
    })

    it('should return false when the index is too large', () => {
      expect(bitIsSet(testBitmap, 1000)).toBe(false)
    })

    it('should throw an error when the index is negative', () => {
      expect(() => bitIsSet(testBitmap, -1)).toThrow()
    })
  })
})
