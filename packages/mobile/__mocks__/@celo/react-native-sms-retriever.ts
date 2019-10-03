import { NativeModules } from 'react-native'

NativeModules.RNSmsRetrieverModule = {}

const smsRetrieverMock = jest.genMockFromModule('@celo/react-native-sms-retriever')

module.exports = smsRetrieverMock
