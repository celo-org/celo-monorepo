import Button, { BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import { Clipboard, StyleSheet, Text } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import LogView from 'src/app/LogView'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { getLatestBlock } from 'src/web3/utils'

interface State {
  reactNativeLogs: string
  gethLogs: string
  latestBlockNumber: number
}

export class Debug extends React.Component<RootState, State> {
  static navigationOptions = { header: null }

  state = {
    reactNativeLogs: '',
    gethLogs: '',
    latestBlockNumber: 0,
  }

  async componentDidMount() {
    await this.updateLogs()
    await this.updateLatestBlock()
  }

  updateLogs = async () => {
    const logs = await Logger.getLogs()
    this.setState({
      reactNativeLogs: (logs && logs.reactNativeLogs) || 'Not Found',
      gethLogs: (logs && logs.gethLogs) || 'Not Found',
    })
  }

  updateLatestBlock = async () => {
    const latestBlock = await getLatestBlock()
    this.setState({
      latestBlockNumber: (latestBlock && latestBlock.number) || 0,
    })
  }

  onClickText = (...text: string[]) => {
    return () => {
      Logger.showMessage('Copied to Clipboard')
      Clipboard.setString(text.join(', '))
    }
  }

  onClickEmailLogs = async () => {
    navigate(Screens.SupportContact)
  }

  render() {
    const { reactNativeLogs, gethLogs, latestBlockNumber } = this.state
    const pincodeType = this.props.account.pincodeType
    const address = currentAccountSelector(this.props) || ''
    const phoneNumber = this.props.account.e164PhoneNumber
    const version = DeviceInfo.getVersion()
    const buildNumber = DeviceInfo.getBuildNumber()
    const apiLevel = DeviceInfo.getApiLevelSync()
    const deviceId = DeviceInfo.getDeviceId()

    return (
      <SafeAreaView style={style.container}>
        <Text
          onPress={this.onClickText(deviceId, phoneNumber)}
          style={style.singleLine}
        >{`Device Id: ${deviceId} | Phone Number: ${phoneNumber}`}</Text>
        <Text
          onPress={this.onClickText(version, buildNumber, String(apiLevel))}
          style={style.singleLine}
        >{`Version: ${version} | Build Number: ${buildNumber} | Api Level: ${apiLevel}`}</Text>
        <Text style={style.singleLine}>{`Pin Type: ${pincodeType}`}</Text>
        <Text
          onPress={this.onClickText(address)}
          style={style.singleLine}
        >{`Address: ${address}`}</Text>
        <Text style={style.singleLine}>{`Latest Block: ${latestBlockNumber}`}</Text>
        <LogView
          title={'React-Native Logs'}
          logs={reactNativeLogs}
          style={style.logView}
          onPress={this.onClickText(reactNativeLogs)}
        />
        <LogView
          title={'Geth Logs'}
          logs={gethLogs}
          style={style.logView}
          onPress={this.onClickText(gethLogs)}
        />
        <Button
          onPress={this.onClickEmailLogs}
          text={'Email logs to support'}
          standard={true}
          type={BtnTypes.PRIMARY}
          style={style.button}
        />
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  singleLine: {
    marginTop: 5,
    fontSize: 11,
  },
  logView: {
    marginTop: 8,
    flex: 1,
  },
  button: {
    marginHorizontal: 0,
    marginTop: 10,
    marginBottom: 0,
  },
})

export default connect<RootState, {}, {}, RootState>((state: RootState) => state)(Debug)
