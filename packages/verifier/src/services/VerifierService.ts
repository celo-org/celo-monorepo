import { NativeModules } from 'react-native'

const { RNVerifierService } = NativeModules

const VerifierService = {
  smsSent: RNVerifierService.smsSent,
  getSMSSendLogs: RNVerifierService.getSMSSendLogs,
  getVerifierServiceStatus: RNVerifierService.getVerifierServiceStatus,
  toggleVerifierService: RNVerifierService.toggleVerifierService,
  getFCMToken: RNVerifierService.getFCMToken,
}

export enum VerifierStatus {
  ON = 'ON',
  OFF = 'OFF',
}

export default VerifierService
