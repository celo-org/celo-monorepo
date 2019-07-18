import ContactCircle from '@celo/react-components/components/ContactCircle'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import PulsingDot from '@celo/react-components/components/PulsingDot'
import QRCode from '@celo/react-components/icons/QRCode'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'
import { devModeTriggerClicked } from 'src/account/actions'
import { CTA_CIRCLE_SIZE } from 'src/account/Education'
import { getUserContactDetails, UserContactDetails } from 'src/account/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { isE2EEnv } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface DispatchProps {
  devModeTriggerClicked: typeof devModeTriggerClicked
}

interface StateProps {
  name: string
  e164Number: string
  photosNUXClicked: boolean
  userContact: UserContactDetails
  devModeActive: boolean
  defaultCountryCode: string
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState) => {
  return {
    name: state.account.name,
    e164Number: state.account.e164PhoneNumber,
    photosNUXClicked: state.account.photosNUXClicked,
    userContact: getUserContactDetails(state),
    devModeActive: state.account.devModeActive || false,
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

export class AccountInfo extends React.Component<Props> {
  handleNameClicked = () => {
    this.props.devModeTriggerClicked()
  }

  handlePhotoClicked = () => {
    const { photosNUXClicked } = this.props
    if (!photosNUXClicked) {
      CeloAnalytics.track(CustomEventNames.photos_education)
      navigate(Screens.PhotosEducation)
    } else {
      CeloAnalytics.track(CustomEventNames.qrcode_main_screen_visit)
      navigate(Screens.QRCode)
    }
  }

  render() {
    const { name, e164Number, photosNUXClicked, userContact, defaultCountryCode } = this.props

    return (
      <View style={style.accountProfile}>
        <TouchableOpacity onPress={this.handlePhotoClicked} style={style.photosNUX}>
          <ContactCircle
            thumbnailPath={userContact.thumbnailPath}
            name={name}
            preferNameInitial={true}
            size={55}
          />
          <View style={style.qrcode}>
            <QRCode />
          </View>
          {!photosNUXClicked && (
            <PulsingDot
              color={colors.messageBlue}
              circleStartSize={CTA_CIRCLE_SIZE}
              style={style.dot}
              animated={!isE2EEnv}
            />
          )}
        </TouchableOpacity>
        {!!name && (
          <Text
            style={[fontStyles.bodySmallSemiBold, style.nameText]}
            onPress={this.handleNameClicked}
            suppressHighlighting={true}
          >
            {name}
          </Text>
        )}
        {!!e164Number && (
          <PhoneNumberWithFlag
            defaultCountryCode={defaultCountryCode}
            e164PhoneNumber={e164Number}
          />
        )}
      </View>
    )
  }
}

const style = StyleSheet.create({
  accountProfile: {
    alignItems: 'center',
  },
  photosNUX: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'visible',
    padding: 10,
  },
  qrcode: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    zIndex: 10,
  },
  nameText: {
    paddingTop: 10,
  },
  dot: {
    position: 'absolute',
    right: -15,
    bottom: 25,
    zIndex: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { devModeTriggerClicked }
  )(AccountInfo)
)
