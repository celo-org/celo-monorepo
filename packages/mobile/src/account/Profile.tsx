import ContactCircle from '@celo/react-components/components/ContactCircle'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { connect } from 'react-redux'
import { UserContactDetails } from 'src/account/reducer'
import { userContactDetailsSelector } from 'src/account/selectors'
import SettingsItem from 'src/account/SettingsItem'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  name: string
  userContact: UserContactDetails
}

interface OwnProps {
  navigation: any
}

type Props = OwnProps & StateProps & WithTranslation
const mapStateToProps = (state: RootState) => {
  return {
    name: state.account.name,
    userContact: userContactDetailsSelector(state),
  }
}

export class Profile extends React.Component<Props> {
  static navigationOptions = headerWithCancelButton

  goToEditProfile = () => {
    CeloAnalytics.track(CustomEventNames.edit_name)
    navigate(Screens.EditProfile)
  }

  render() {
    const { t, userContact, name } = this.props
    return (
      <ScrollView style={style.scrollView}>
        <View style={style.container}>
          <View style={style.accountProfile}>
            <ContactCircle
              thumbnailPath={userContact.thumbnailPath}
              name={name}
              preferNameInitial={true}
              size={55}
            />
          </View>
        </View>
        <View style={[style.container, style.underlinedBox]}>
          <SettingsItem
            testID="ProfileEditName"
            title={t('editName')}
            onPress={this.goToEditProfile}
          />
        </View>
      </ScrollView>
    )
  }
}

const style = StyleSheet.create({
  accountProfile: {
    paddingLeft: 10,
    paddingTop: 30,
    paddingRight: 15,
    paddingBottom: 15,
    flexDirection: 'column',
    alignItems: 'center',
  },
  underlinedBox: {
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingLeft: 20,
  },
})

export default connect<StateProps, {}, OwnProps, RootState>(mapStateToProps)(
  withTranslation(Namespaces.accountScreen10)(Profile)
)
