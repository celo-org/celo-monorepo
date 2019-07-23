import { validateInput } from '../src/inputValidation'

describe('inputValidation', () => {
  function validateFunction(
    desc: string,
    itStr: string,
    inputs: string[],
    validator: 'phone' | 'integer' | 'decimal',
    expected: string
  ) {
    describe(desc, () => {
      inputs.forEach((input) =>
        it(`${itStr}: ${input}`, () => {
          const result = validateInput(input, { validator, countryCallingCode: '1' })
          expect(result).toEqual(expected)
        })
      )
    })
  }

  validateFunction(
    'validateInteger',
    'Removes invalid characters',
    ['bu123n', '123', '-123', '1b2u3n', '1.2.3.'],
    'integer',
    '123'
  )

  validateFunction(
    'validateDecimal',
    'Removes invalid characters',
    ['bu1.23n', '1.2.3', '1.23', '1.2.-_[`/,zx3.....', '1.b.23'],
    'decimal',
    '1.23'
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
    ],
    'phone',
    '(402) 393-9889'
  )
})
