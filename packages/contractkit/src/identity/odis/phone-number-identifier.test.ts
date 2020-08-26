import { isSufficientBalanceForQuotaRetrieval } from './phone-number-identifier'
describe(isSufficientBalanceForQuotaRetrieval, () => {
  it('identifies sufficient balance correctly', () => {
    expect(isSufficientBalanceForQuotaRetrieval(0.09)).toBe(false)
    expect(isSufficientBalanceForQuotaRetrieval(0.1)).toBe(true)
  })
})
