import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { AvatarSelf } from 'src/components/AvatarSelf'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import QRCode from 'src/qrcode/QRGen'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

type OwnProps = StackScreenProps<StackParamList, Screens.QRCode>

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  address: string | undefined
  displayName: string | undefined
  e164PhoneNumber: string | undefined
  rawSignedTransaction: string | undefined
}

const mapStateToProps = (state: RootState, ownProps: OwnProps): Partial<UriData> => {
  const { route } = ownProps
  return {
    address: currentAccountSelector(state)!,
    displayName: state.account.name || undefined,
    e164PhoneNumber: state.account.e164PhoneNumber || undefined,
    rawSignedTransaction: route.params ? route.params.rawSignedTransaction : undefined,
  }
}

function QRCodeDisplay(props: Props) {
  const qrContent: string = useMemo(() => {
    if (props.rawSignedTransaction) {
      Logger.debug('Using data.rawSignedTransaction', props.rawSignedTransaction)
      return urlFromUriData({ rawSignedTransaction: props.rawSignedTransaction })
    }
    Logger.debug('Not using data.rawSignedTransaction')
    return urlFromUriData(props)
  }, [props.address, props.displayName, props.e164PhoneNumber, props.rawSignedTransaction])
  Logger.debug('qrContent', qrContent)
  return (
    <SafeAreaView style={styles.container}>
      <AvatarSelf iconSize={64} displayNameStyle={fontStyles.h2} />
      <View style={styles.qrContainer}>
        <QRCode value={qrContent} size={variables.width / 2} svgRef={props.qrSvgRef} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
  },
  qrContainer: {
    paddingTop: 16,
  },
})

export default connect<{}, {}, OwnProps, RootState>(mapStateToProps)(QRCodeDisplay)
