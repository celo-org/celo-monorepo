import * as utils from '../../src/utils/input-validation'

describe('Input Validation test suite', () => {
  describe('hasValidAccountParam utility', () => {
    it('Should return true for proper address', () => {
      const sampleData = {
        account: '0xc1912fee45d61c87cc5ea59dae31190fffff232d',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeTruthy()
    })

    it('Should return false for nonsense address', () => {
      const sampleData = {
        account: '0xAA',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeFalsy()
    })

    it('Should return false with missing address', () => {
      const sampleData = {
        account: '',
      }

      const result = utils.hasValidAccountParam(sampleData)

      expect(result).toBeFalsy()
    })
  })
})
