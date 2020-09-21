import { isElementVisible } from './utils'

export const celoEducation = async () => {
  await element(by.id('Hamburguer')).tap()
  await element(by.id('DrawerItem/CELO')).tap()

  if (await isElementVisible('Education/progressButton')) {
    for (let i = 0; i < 4; i++) {
      await element(by.id('Education/progressButton')).tap()
    }
  }
}
