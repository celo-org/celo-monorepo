import rateLimit from 'express-rate-limit'
import Sentry from './sentry'
const MS = 1000
const SECONDS = 60
const MINUTES = 15
export default rateLimit({
  windowMs: MINUTES * SECONDS * MS,
  max: 30, // max request within the time window per ip,
  message: '',
  onLimitReached(req) {
    Sentry.captureEvent({ message: 'rate limit reached', extra: req.body })
  },
  keyGenerator(req) {
    return (req.headers['x-appengine-user-ip'] || req.ip).toString()
  },
  headers: false,
  statusCode: 200,
})
