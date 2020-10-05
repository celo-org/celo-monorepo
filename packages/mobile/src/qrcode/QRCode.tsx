import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { shallowEqual, useSelector } from 'react-redux'
import { AvatarSelf } from 'src/components/AvatarSelf'
import QRCode from 'src/qrcode/QRGen'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import { currentAccountSelector } from 'src/web3/selectors'
import Logger from 'src/utils/Logger'
import { StackScreenProps } from '@react-navigation/stack'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { connect } from 'react-redux'

type OwnProps = StackScreenProps<StackParamList, Screens.QRCode>

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  address: string
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
  // const data = useSelector(mapStateToProps, shallowEqual)
  let qrContent: string
  if (props.rawSignedTransaction) {
    Logger.debug('Using data.rawSignedTransaction', props.rawSignedTransaction)
    qrContent = useMemo(
      () => urlFromUriData({ rawSignedTransaction: props.rawSignedTransaction }),
      [props.rawSignedTransaction]
    )
  } else {
    Logger.debug('Not using rawSignedTransaction')
    qrContent = useMemo(() => urlFromUriData(props), [
      props.address,
      props.displayName,
      props.e164PhoneNumber,
    ])
  }
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
