import * as actions from 'src/app/actions'
import { initialState, reducer } from 'src/app/reducer'

describe('reducer', () => {
  describe(actions.setName, () => {
    it('sets the name', () => {
      expect(reducer(initialState, actions.setName('Jester'))).toMatchSnapshot()
    })
  })
  describe(actions.showMessage, () => {
    it('sets a message', () => {
      expect(reducer(initialState, actions.showMessage('Jester'))).toMatchSnapshot()
    })
    it('sets a message with a title', () => {
      expect(
        reducer(initialState, actions.showMessage('The Thing is being Tested', null, 'Unit Test'))
      ).toMatchSnapshot()
    })
  })
  describe(actions.clearMessage, () => {
    it('removes all messages and bannerTitles', () => {
      expect(
        reducer(
          { ...initialState, message: 'should not show', bannerTitle: 'nope' },
          actions.clearMessage()
        )
      ).toMatchSnapshot()
    })
  })
  describe(actions.setVerificationState, () => {
    it('sets timestamp of verifyingOffAt, set isVerifying to false', () => {
      const testdate = Date.now()
      expect(reducer(initialState, actions.setVerificationState(false, testdate))).toMatchObject({
        verifyingOffAt: testdate,
        isVerifying: false,
      })
    })
    it('sets isVerifying to true, does not effect verifyingOffAt', () => {
      const testdate = Date.now()
      expect(reducer(initialState, actions.setVerificationState(true, testdate))).toMatchObject({
        verifyingOffAt: null,
        isVerifying: true,
      })
    })
  })
})
