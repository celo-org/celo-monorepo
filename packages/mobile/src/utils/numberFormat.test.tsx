import * as RNLocalize from 'react-native-localize'
import { convertToPeriodDecimalSeparator } from 'src/utils/numberFormat'

describe('convertToPeriodDecimalSeparator', () => {
  it('converts correctly', () => {
    expect(convertToPeriodDecimalSeparator('1.23')).toBe('1.23')
    expect(convertToPeriodDecimalSeparator('1,23')).toBe('1,23')
    ;(RNLocalize.getNumberFormatSettings as jest.Mock).mockReturnValue({
      decimalSeparator: ',',
    })
    expect(convertToPeriodDecimalSeparator('1,23')).toBe('1.23')
  })
})
