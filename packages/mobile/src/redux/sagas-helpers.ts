import { call, delay, race, select, take } from 'redux-saga/effects'
import { RootState } from 'src/redux/reducers'

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

export function* waitFor<Value = any>(selector: (state: RootState) => Value) {
  while (true) {
    const value: Value = yield select(selector)
    if (value != null) {
      return value
    }
    yield take('*')
  }
}
