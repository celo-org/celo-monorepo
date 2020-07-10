import ContactCircle from '@celo/react-components/components/ContactCircle'
import { SettingsItemInput } from '@celo/react-components/components/SettingsItem'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { setName } from 'src/account/actions'
import { UserContactDetails } from 'src/account/reducer'
import { userContactDetailsSelector } from 'src/account/selectors'
import { Namespaces, withTranslation } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  name: string | null
  userContact: UserContactDetails
}

interface DispatchProps {
  setName: typeof setName
}

// tslint:disable-next-line: no-empty-interface
interface OwnProps {}

type Props = OwnProps & StateProps & DispatchProps & WithTranslation
const mapStateToProps = (state: RootState) => {
  return {
    name: state.account.name,
    userContact: userContactDetailsSelector(state),
  }
}

const mapDispatchToProps = {
  setName,
}

export class Profile extends React.Component<Props> {
  render() {
    const { t, userContact, name } = this.props
    return (
      <ScrollView style={styles.container}>
        <SafeAreaView>
          <Text style={styles.title}>{t('editProfile')}</Text>
          <View style={styles.accountProfile}>
            <ContactCircle thumbnailPath={userContact.thumbnailPath} name={name} size={80} />
          </View>
          <SettingsItemInput
            value={this.props.name ?? t('global:unknown')}
            testID="ProfileEditName"
            title={t('name')}
            placeholder={t('yourName')}
            onValueChange={this.props.setName}
          />
        </SafeAreaView>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.light,
  },
  title: {
    ...fontStyles.h2,
    margin: 16,
  },
})

export default connect<StateProps, {}, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.accountScreen10)(Profile))
