import { quote, sleep } from '../utils/utils'

export default HandleDeepLinkDappkit = () => {
  const DAPPKIT_URL = quote(
    'celo://wallet/dappkit?type=sign_tx&requestId=beneficiaryclaim&callback=impactmarket%3A%2F%2F&dappName=impactmarket&txs=W3sidHhEYXRhIjoiMHg0ZTcxZDkyZCIsImVzdGltYXRlZEdhcyI6MTIxMTI3LCJmcm9tIjoiMHhhY2FGQjRGMWQ5RERGMTQwNWViZEJGZWM5NTlBNzI4MTk0QjAyMzhhIiwidG8iOiIweDc0ZTVDNDA1RURFNEUzN2U3ODBEQjk2NTI1NDE1MzhkZDhBNzlBN2QiLCJub25jZSI6MjYsImZlZUN1cnJlbmN5QWRkcmVzcyI6IjB4NzY1REU4MTY4NDU4NjFlNzVBMjVmQ0ExMjJiYjY4OThCOEIxMjgyYSIsInZhbHVlIjoiMCJ9XQ%3D%3D'
  )

  it('Launch app with dappkit deep link', async () => {
    await device.terminateApp()
    // I think at least on android we need this sleep because the
    // OS has a timeout period in between closing and reopening an app
    await sleep(5000)
    await device.launchApp({ url: DAPPKIT_URL, newInstance: true })
    // this second sleep is to allow for navigation to reach the desired deep link handler
    await sleep(5000)

    // press Allow button on DappKitSignTxScreen
    await element(by.id('DappkitAllow')).tap()

    // Arrived at pin code enter screen
    await expect(element(by.id('digit1'))).toBeVisible()
  })
}
