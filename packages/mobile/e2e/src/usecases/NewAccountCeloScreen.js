import { sleep } from '../utils/utils'
import { celoEducation } from '../utils/celoEducation'

export default NewAccountCeloScreen = () => {
  it('Go to CELO screen and through education flow', async () => {
    await celoEducation()
  })

  it('Buy CELO button not visible', async () => {
    // Not ideal, the buy button always takes a little bit of time to appear,
    // but it shouldn't in this case.
    await sleep(5000)
    await expect(element(by.id('BuyCelo'))).toBeNotVisible()
  })
}
