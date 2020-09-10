import { sleep } from '../utils/utils'
import { celoOnboarding } from '../utils/celoOnboarding'

export default NewAccountCeloScreen = () => {
  it('Go to CELO screen and through onboarding', async () => {
    await celoOnboarding()
  })

  it('Buy CELO button not visible', async () => {
    // Not ideal, the buy button always takes a little bit of time to appear,
    // but it shouldn't in this case.
    sleep(5000)
    await expect(element(by.id('BuyCelo'))).toBeNotVisible()
  })
}
