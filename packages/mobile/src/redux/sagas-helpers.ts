import { call, delay, race } from 'redux-saga/effects'

export function withTimeout<Fn extends (...args: any[]) => any>(
  wait: number,
  fn: Fn,
  ...args: Parameters<Fn>
) {
  return function* withTimeoutGen() {
    const { res, timeout } = yield race({
      res: call(fn, ...args),
      timeout: delay(wait),
    })
    if (timeout) {
      // TODO(cmcewen): #2824 Handle failure case properly
    }
    return res
  }
}
