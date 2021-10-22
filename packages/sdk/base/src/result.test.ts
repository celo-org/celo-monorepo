import { Err, isOk, Ok, Result } from '.'

// These tests are just to check the typescript compiler
describe('discriminated collection functions', () => {
  const trueValue = Ok(true)
  const falseValue = Err(new Error())
  const collection: Array<Result<boolean, Error>> = [trueValue, falseValue]

  it('can filter to the true value', () => {
    const ok = collection.filter(isOk)
    expect(ok.map((_) => _.result)).toEqual([true])
  })

  it('can find in collection', () => {
    const ok = collection.find(isOk)
    if (ok) {
      expect(ok.result).toEqual(true)
    }
  })
})
