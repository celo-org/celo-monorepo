import rateLimit from 'express-rate-limit'
import Sentry from './sentry'
const MS = 1000
const SECONDS = 60
const MINUTES = 20
export default rateLimit({
  windowMs: MINUTES * SECONDS * MS,
  max: 30, // max request within the time window per ip,
  message: 'breathe',
  onLimitReached(req) {
    Sentry.captureEvent({ message: 'rate limit reached', extra: req.body })
  },
  keyGenerator(req) {
    // FOR consideration, should each endpoint be separate?
    return req.ip
  },
  headers: false,
})
