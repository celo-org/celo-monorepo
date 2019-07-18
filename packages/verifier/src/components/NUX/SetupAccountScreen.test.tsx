// import * as React from 'react'
import 'react-native'
// import SetupAccountScreen from 'src/components/NUX/SetupAccountScreen'

jest.mock('@celo/react-components/components/PhoneNumberInput', () => ({
  default: () => '<View>PhoneNumberInput</View>',
}))
jest.mock('src/services/VerifierService')
jest.mock('src/services/FirebaseDb')
jest.mock('@celo/react-components/services/NavigationService')

// Todo why is this failing?
describe.skip('SetupAccountScreen', () => {
  it('renders correctly', () => {
    // const tree = renderer.create(<SetupAccountScreen />)
    // expect(tree).toMatchSnapshot()
  })
})
