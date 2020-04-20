import Button, { BtnTypes } from '@celo/react-components/components/Button'
import QRCode from '@celo/react-components/icons/QRCode'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { memoize } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { RNCamera } from 'react-native-camera'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationFocusInjectedProps, withNavigationFocus } from 'react-navigation'
import { connect } from 'react-redux'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NotAuthorizedView from 'src/qrcode/NotAuthorizedView'
import { handleBarcodeDetected } from 'src/send/actions'
import Logger from 'src/utils/Logger'

interface DispatchProps {
  handleBarcodeDetected: typeof handleBarcodeDetected
}

type Props = DispatchProps & WithTranslation & NavigationFocusInjectedProps

class QRScanner extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('sendFlow7:scanCode'),
  })

  timeout: undefined | number = undefined

  state = {}

  camera: RNCamera | null = null

  // This method would be called multiple times with the same
  // QR code, so we need to catch only the first one
  onBarCodeDetected = (rawData: any) => {
    Logger.debug('QRScanner', 'Bar code detected')
    this.props.handleBarcodeDetected(rawData)
  }

  onPressShowYourCode = () => {
    navigate(Screens.QRCode)
  }

  render() {
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.innerContainer}>
          {(Platform.OS !== 'android' || this.props.isFocused) && (
            <RNCamera
              ref={(ref) => {
                this.camera = ref
              }}
              style={styles.preview}
              type={RNCamera.Constants.Type.back}
              onBarCodeRead={memoize(this.onBarCodeDetected, (qr) => qr.data)}
              barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
              flashMode={RNCamera.Constants.FlashMode.auto}
              captureAudio={false}
              autoFocus={RNCamera.Constants.AutoFocus.on}
              // Passing null here since we want the default system message
              // @ts-ignore
              androidCameraPermissionOptions={null}
              notAuthorizedView={<NotAuthorizedView />}
            >
              <View style={styles.view}>
                <View style={styles.fillVertical} />
                <View style={styles.cameraRow}>
                  <View style={styles.fillHorizontal} />
                  <View style={styles.cameraContainer}>
                    <View style={styles.camera} />
                    <View style={styles.infoBox}>
                      <Text style={styles.infoText}>{t('cameraScanInfo')}</Text>
                    </View>
                  </View>
                  <View style={styles.fillHorizontal} />
                </View>
                <View style={styles.fillVertical} />
              </View>
            </RNCamera>
          )}
        </View>
        <View style={styles.footerContainer}>
          <Button
            onPress={this.onPressShowYourCode}
            text={t('showYourQRCode')}
            standard={false}
            type={BtnTypes.SECONDARY}
          >
            <View style={styles.footerIcon}>
              <QRCode />
            </View>
          </Button>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  camera: {
    height: 200,
    width: 200,
    borderRadius: 4,
  },
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillVertical: {
    backgroundColor: 'rgba(46, 51, 56, 0.3)',
    width: variables.width,
    flex: 1,
  },
  fillHorizontal: {
    backgroundColor: 'rgba(46, 51, 56, 0.3)',
    flex: 1,
  },
  cameraRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  cameraContainer: {
    height: 200,
  },
  infoBox: {
    paddingVertical: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.dark,
    opacity: 1,
    marginTop: 15,
    borderRadius: 3,
  },
  infoText: {
    ...fontStyles.bodySmall,
    lineHeight: undefined,
    color: colors.white,
  },
  footerContainer: {
    backgroundColor: colors.background,
  },
  footerIcon: {
    borderWidth: 1,
    borderRadius: 15,
    borderColor: colors.celoGreen,
    padding: 4,
  },
})

export default componentWithAnalytics(
  withNavigationFocus(
    // @ts-ignore
    connect(null, {
      handleBarcodeDetected,
    })(withTranslation(Namespaces.sendFlow7)(QRScanner))
  )
)
