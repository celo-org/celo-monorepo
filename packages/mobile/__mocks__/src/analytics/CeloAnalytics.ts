class WalletAnalytics {
  track = jest.fn((event: string) => {
    console.log('Track event', event)
  })
  startTracking = jest.fn((event: string) => {
    console.log('Start tracking event', event)
  })
  trackSubEvent = jest.fn((event: string, subEvent: string) => {
    console.log('Track sub event', event, subEvent)
  })
  stopTracking = jest.fn((event: string) => {
    console.log('Stop tracking', event)
  })
}

export default new WalletAnalytics()
