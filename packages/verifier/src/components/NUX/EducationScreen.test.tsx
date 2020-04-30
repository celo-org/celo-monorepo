import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import configureMockStore from 'redux-mock-store'
import Education from 'src/components/NUX/EducationScreen'

const mockStore = configureMockStore([])

jest.mock('react-native-config', () => {
  return {
    enableAdvertisingTracking: false,
  }
})

it('renders correctly', () => {
  const store = mockStore({ app: { language: 'en' } })
  const tree = renderer.create(
    <Provider store={store}>
      <Education />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
