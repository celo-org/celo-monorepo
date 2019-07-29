import { BaseProps, validateInput } from '../src/inputValidation'

describe('inputValidation', () => {
  function validateFunction(
    desc: string,
    itStr: string,
    inputs: string[],
    validator: 'phone' | 'integer' | 'decimal',
    expected: string,
    props?: BaseProps
  ) {
    describe(desc, () => {
      inputs.forEach((input) =>
        it(`${itStr}: ${input}`, () => {
          const result = validateInput(input, { validator, countryCallingCode: '1', ...props })
          expect(result).toEqual(expected)
        })
      )
    })
  }

  const numbers = ['bu1.23n', '1.2.3', '1.23', '1.2.-_[`/,zx3.....', '1.b.23']

  validateFunction('validateInteger', 'Removes invalid characters', numbers, 'integer', '123')

  validateFunction('validateDecimal', 'Removes invalid characters', numbers, 'decimal', '1.23')

  validateFunction(
    'validateDecimal',
    'Supports commas',
    numbers.map((val) => val.replace('.', ',')),
    'decimal',
    '1,23',
    { lng: 'es-AR' }
  )

  validateFunction(
    'validatePhone',
    'Removes invalid characters and formats numbers',
    [
      '4023939889',
      '(402)3939889',
      '(402)393-9889',
      '402bun393._=988-9',
      '402 393 9889',
      '(4023) 9-39-88-9',
      '4-0-2-3-9-3-9-8-8-9', // phone-kebab
    ],
    'phone',
    '(402) 393-9889'
  )
})
