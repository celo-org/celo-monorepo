export default HandleDeepLinkSend = () => {
  it('Send url while app is in foreground', async () => {
    const url =
      'celo://wallet/pay?address=0x0b784e1cf121a2d9e914ae8bfe3090af0882f229%26displayName=Crypto4BlackLives%26e164PhoneNumber=%2B14046251530'
    await device.openURL({ url })

    // Arrived at SendAmount screen
    expect(element(by.id('Review'))).toBeVisible()
  })

  it('Launch app cold with url', async () => {
    await device.terminateApp()
    const url =
      'celo://wallet/pay?address=0x0b784e1cf121a2d9e914ae8bfe3090af0882f229%26displayName=Crypto4BlackLives%26e164PhoneNumber=%2B14046251530'
    await device.launchApp({ url })

    // Arrived at SendAmount screen
    expect(element(by.id('Review'))).toBeVisible()
  })

  it('Send url while app is in background, process running', async () => {
    await device.sendToHome()
    const url =
      'celo://wallet/pay?address=0x0b784e1cf121a2d9e914ae8bfe3090af0882f229%26displayName=Crypto4BlackLives%26e164PhoneNumber=%2B14046251530'
    await device.launchApp({ url, newInstance: false })

    // Arrived at SendAmount screen
    expect(element(by.id('Review'))).toBeVisible()
  })
}
