class WalletAnalytics {
  track = jest.fn((event: any) => {
    console.log('Track event', event)
  })
}

export default new WalletAnalytics()
