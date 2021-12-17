import * as functions from 'firebase-functions'
import { testQuery } from './test'

export const odisMonitorScheduleFunction = functions
  .region('us-central1', 'europe-west3')
  .pubsub.schedule('every 5 minutes')
  .onRun(testQuery)
