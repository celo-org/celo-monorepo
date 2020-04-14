import Limit from 'express-rate-limit'
const MS = 1000
const SECONDS = 60
const MINUTES = 20
export default new Limit({
  windowMs: MINUTES * SECONDS * MS,
  max: 30, // max request within the time window per ip,
  message: 'breathe',
  onLimitReached(req) {
    console.log('limit reached while processing:', req.body)
  },
  keyGenerator(req) {
    // FOR consideration, should each endpoint be separate?
    return req.ip
  },
  headers: false,
})
