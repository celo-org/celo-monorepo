import { isElementVisible, sleep } from './utils'

export const celoEducation = async () => {
  await element(by.id('Hamburguer')).tap()
  await element(by.id('DrawerItem/CELO')).tap()
  // Not ideal, but needed to help with flakiness.
  await sleep(3000)

  if (await isElementVisible('Education/progressButton')) {
    for (let i = 0; i < 4; i++) {
      await element(by.id('Education/progressButton')).tap()
    }
  }
}
