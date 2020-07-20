import { AppEvents } from '@celo/mobile/src/analytics/Events'
import { AnalyticsPropertiesList } from '@celo/mobile/src/analytics/Properties'

class ValoraAnalytics {
  startSession = jest.fn(
    (
      eventName: typeof AppEvents.app_launched,
      eventProperties: {
        loadingDuration: number
        deviceInfo?: object
      }
    ) => console.log(eventName, eventProperties)
  )
  getSessionId = jest.fn(() => 'this is a session id')
  setUserAddress = jest.fn((address: string | null | undefined) => console.log(address))
  track = jest.fn(
    <EventName extends keyof AnalyticsPropertiesList>(
      ...args: undefined extends AnalyticsPropertiesList[EventName]
        ? [EventName] | [EventName, AnalyticsPropertiesList[EventName]]
        : [EventName, AnalyticsPropertiesList[EventName]]
    ) => {
      console.log('Track event', ...args)
    }
  )
  page = jest.fn((page: string, eventProperties: {}) => {
    console.log('Page', page, eventProperties)
  })
}

export default new ValoraAnalytics()
