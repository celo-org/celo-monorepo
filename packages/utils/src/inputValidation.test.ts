import { BaseProps, validateInput, ValidatorKind } from './inputValidation'

describe('inputValidation', () => {
  function validateFunction(
    itStr: string,
    inputs: string[],
    validator: ValidatorKind,
    expected: string,
    props?: BaseProps
  ) {
    it(itStr, () =>
      inputs.forEach((input) => {
        const result = validateInput(input, { validator, countryCallingCode: '1', ...props })
        expect(result).toEqual(expected)
      })
    )
  }

  const numbers = ['bu1.23n', '1.2.3', '1.23', '1.2.-_[`/,zx3.....', '1.b.23']

  validateFunction('validates integers', numbers, ValidatorKind.Integer, '123')

  validateFunction('validates decimals', numbers, ValidatorKind.Decimal, '1.23')

  validateFunction(
    'allows comma decimals',
    numbers.map((val) => val.replace('.', ',')),
    ValidatorKind.Decimal,
    '1,23',
    { lng: 'es-419' }
  )

  validateFunction(
    'validates phone numbers',
    [
      '4023939889',
      '(402)3939889',
      '(402)393-9889',
      '402bun393._=988-9',
      '402 393 9889',
      '(4023) 9-39-88-9',
      '4-0-2-3-9-3-9-8-8-9', // phone-kebab
    ],
    ValidatorKind.Phone,
    '(402) 393-9889'
  )
})
