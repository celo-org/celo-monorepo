import Button, { BtnTypes } from '@celo/react-components/components/Button'
import ContactCircle from '@celo/react-components/components/ContactCircle'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import DownloadIcon from '@celo/react-components/icons/Download'
import ScanCodeIcon from '@celo/react-components/icons/ScanCode'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { connect } from 'react-redux'
import { getUserContactDetails, UserContactDetails } from 'src/account/reducer'
import BackButton from 'src/components/BackButton'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { shareQRCode, SVG } from 'src/send/actions'
import { currentAccountSelector } from 'src/web3/selectors'

interface DispatchProps {
  shareQRCode: typeof shareQRCode
}

interface State {
  qrContent: string
}

interface StateProps {
  name: string
  e164Number: string
  userContact: UserContactDetails
  account: string | null
  defaultCountryCode: string
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState) => {
  return {
    name: state.account.name,
    e164Number: state.account.e164PhoneNumber,
    userContact: getUserContactDetails(state),
    account: currentAccountSelector(state),
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

const mapDispatchToProps = {
  shareQRCode,
}

class QRCodeDisplay extends React.Component<Props, State> {
  static navigationOptions = {
    headerTitle: 'QR Code',
    headerTitleStyle: [fontStyles.headerTitle, componentStyles.screenHeader],
    headerLeft: <BackButton />,
    // This helps vertically center the title
    headerRight: <View />,
  }

  state = {
    qrContent: '{}',
  }

  svg: SVG | null = null

  qrCodeRefReady = (c: SVG) => (this.svg = c)

  downloadImage = () => this.props.shareQRCode(this.svg)

  goToScanCode = () => {
    navigate(Screens.QRScanner)
  }

  async componentDidMount() {
    const { name, account, e164Number } = this.props
    const qrContent = JSON.stringify({
      address: account,
      e164PhoneNumber: e164Number,
      displayName: name,
    })
    this.setState({ qrContent })
  }

  render() {
    const { name, e164Number, userContact, defaultCountryCode, t } = this.props

    return (
      <View style={style.container}>
        <View style={style.userInfo}>
          <ContactCircle
            thumbnailPath={userContact.thumbnailPath}
            name={name}
            preferNameInitial={true}
            size={55}
          />
          <Text style={style.nameText} suppressHighlighting={true}>
            {name}
          </Text>
          <PhoneNumberWithFlag
            defaultCountryCode={defaultCountryCode}
            e164PhoneNumber={e164Number}
          />
        </View>
        <QRCode
          value={this.state.qrContent}
          size={variables.width / 2}
          color={colors.darkGrey}
          getRef={this.qrCodeRefReady}
        />
        <View style={style.buttonContainer}>
          <Button
            onPress={this.downloadImage}
            text={t('saveCodeImage')}
            accessibilityLabel={t('saveCodeImage')}
            standard={true}
            type={BtnTypes.PRIMARY}
            disabled={false}
            style={[fontStyles.buttonText]}
          >
            <DownloadIcon />
          </Button>
          <Button
            onPress={this.goToScanCode}
            text={t('scanCode')}
            accessibilityLabel={t('scanCode')}
            standard={true}
            type={BtnTypes.SECONDARY}
            disabled={false}
          >
            <ScanCodeIcon color={colors.celoGreen} />
          </Button>
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    height: variables.height,
  },
  userInfo: {
    paddingTop: 25,
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'Hindi Siliguri',
    fontWeight: '500',
    color: colors.dark,
    paddingTop: 20,
    paddingBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    width: variables.width,
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonScan: {
    color: colors.celoGreen,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces(Namespaces.sendFlow7)(QRCodeDisplay))
