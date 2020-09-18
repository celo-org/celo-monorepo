import * as utf8 from 'utf8'
import coder from 'web3-eth-abi'
import { Input } from '../src/helpers/Input'
import { InputDecoder } from '../src/helpers/InputDecoder'

const comment = '✨'
const input = coder.encodeFunctionCall(
  {
    name: 'transferWithComment',
    type: 'function',
    inputs: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'amount' },
      { type: 'string', name: 'comment' },
    ],
  },
  ['0x423043cca38e75d7913504fedfd1dd4539cc55b3', '1000000000000000000', utf8.encode(comment)]
)

const savedInput =
  '0xe1d6aceb000000000000000000000000423043cca38e75d7913504fedfd1dd4539cc55b30000' +
  '000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000' +
  '000000000000000000000000000000000000000000006000000000000000000000000000000000' +
  '00000000000000000000000000000006c3a2c29cc2a80000000000000000000000000000000000' +
  '000000000000000000'

const contractAddresses = {
  Attestations: '0x0000000000000000000000000000000000a77357',
  Escrow: '0x0000000000000000000000000000000000a77327',
  Exchange: '0xf1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
  Governance: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
  Reserve: '0x6a61e1e693c765cbab7e02a500665f2e13ee46df',
}

describe('Blockchain API Utils', () => {
  describe('format-comment-string', () => {
    it('should decode comment correctly', () => {
      const decoder = new InputDecoder(contractAddresses, Input.fromString(input))
      const decoded = decoder.getTransactionComment()
      expect(decoded).toEqual(comment)
    })
    xit('should return empty on too short input', () => {
      const decoder = new InputDecoder(contractAddresses, Input.fromString('0x10'))
      const decoded = decoder.getTransactionComment()
      expect(decoded).toEqual('')
    })
    xit('should return empty on invalid function selector', () => {
      const decoder = new InputDecoder(
        contractAddresses,
        Input.fromString(
          '0x095ea7b30000000000000000000000000000000000000000000000000000000000000' +
            'abe0000000000000000000000000000000000000000000000000214e8348c4f0000'
        )
      )
      const decoded = decoder.getTransactionComment()
      expect(decoded).toEqual('')
    })
    it('should return empty on malformed input', () => {
      const decoder = new InputDecoder(contractAddresses, Input.fromString(input.slice(0, 80)))
      const decoded = decoder.getTransactionComment()
      expect(decoded).toEqual('')
    })
  })
  describe('AbiEncoder', () => {
    it('should not regress on encodeFuctionCall', () => {
      expect(input).toEqual(savedInput)
    })
  })
})
