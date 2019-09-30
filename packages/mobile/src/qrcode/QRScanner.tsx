import QRCode from '@celo/react-components/icons/QRCode'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { RNCamera } from 'react-native-camera'
import { NavigationFocusInjectedProps, withNavigationFocus } from 'react-navigation'
import { connect } from 'react-redux'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handleBarcodeDetected } from 'src/send/actions'
import { requestCameraPermission } from 'src/utils/androidPermissions'
import Logger from 'src/utils/Logger'

enum BarcodeTypes {
  QR_CODE = 'QR_CODE',
}

interface DispatchProps {
  handleBarcodeDetected: typeof handleBarcodeDetected
}

type Props = DispatchProps & WithNamespaces & NavigationFocusInjectedProps

const goToQrCodeScreen = () => {
  navigate(Screens.QRCode)
}

class QRScanner extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('sendFlow7:scanCode'),
  })

  camera: RNCamera | null = null

  state = {
    camera: false,
    qrSubmitted: false,
  }

  async componentDidMount() {
    const { t } = this.props
    const cameraPermission = await requestCameraPermission()

    if (!cameraPermission) {
      Logger.showMessage(t('needCameraPermissionToScan'))
      navigate(Screens.QRCode)
      return
    }
    this.setState({ camera: true, qrSubmitted: false })
  }

  onBardCodeDetected = (rawData: any) => {
    if (rawData.type === BarcodeTypes.QR_CODE && !this.state.qrSubmitted) {
      this.setState({ qrSubmitted: true }, () => {
        this.props.handleBarcodeDetected(rawData)
      })
    }
  }

  render() {
    const { t } = this.props
    return (
      <View style={styles.container}>
        {this.state.camera &&
          this.props.isFocused && (
            <RNCamera
              ref={(ref) => {
                this.camera = ref
              }}
              // @ts-ignore
              style={styles.preview}
              type={RNCamera.Constants.Type.back}
              onBarCodeRead={this.onBardCodeDetected}
              barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
              flashMode={RNCamera.Constants.FlashMode.auto}
              captureAudio={false}
              autoFocus={RNCamera.Constants.AutoFocus.on}
            >
              <View style={styles.view}>
                <View style={styles.viewFillVertical} />
                <View style={styles.viewCameraRow}>
                  <View style={styles.viewFillHorizontal} />
                  <View style={styles.viewCameraContainer}>
                    <View style={styles.camera} />
                    <Text style={[fontStyles.bodySmall, styles.viewInfoBox]}>
                      {t('ScanCodeByPlacingItInTheBox')}
                    </Text>
                  </View>
                  <View style={styles.viewFillHorizontal} />
                </View>
                <View style={styles.viewFillVertical} />
              </View>
              <View style={styles.footerContainer}>
                <View style={styles.footerIcon}>
                  <QRCode />
                </View>
                <TouchableOpacity onPress={goToQrCodeScreen}>
                  <Text style={styles.footerText}> {t('showYourQRCode')} </Text>
                </TouchableOpacity>
              </View>
            </RNCamera>
          )}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
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
    zIndex: 99,
  },
  view: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFillVertical: {
    backgroundColor: 'rgba(46, 51, 56, 0.3)',
    width: variables.width,
    flex: 1,
  },
  viewFillHorizontal: {
    backgroundColor: 'rgba(46, 51, 56, 0.3)',
    flex: 1,
  },
  viewCameraRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  viewCameraContainer: {
    height: 200,
  },
  viewInfoBox: {
    paddingVertical: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.dark,
    opacity: 1,
    marginTop: 15,
    color: colors.white,
    zIndex: 99,
  },
  footerContainer: {
    height: 50,
    width: variables.width,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  footerIcon: {
    borderWidth: 1,
    borderRadius: 15,
    borderColor: colors.celoGreen,
    padding: 4,
  },
  footerText: {
    color: colors.celoGreen,
  },
})

export default componentWithAnalytics(
  withNavigationFocus(
    connect(
      null,
      {
        handleBarcodeDetected,
      }
    )(withNamespaces(Namespaces.sendFlow7)(QRScanner))
  )
)
