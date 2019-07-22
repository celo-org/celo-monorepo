import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import VerifyAddressBook from 'src/icons/VerifyAddressBook'
import { importContacts } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { requestContactsPermission } from 'src/utils/androidPermissions'

interface DispatchProps {
  importContacts: typeof importContacts
}

type Props = WithNamespaces & DispatchProps

class ImportContacts extends React.Component<Props> {
  static navigationOptions = {
    headerStyle: {
      elevation: 0,
    },
    headerLeft: null,
    headerRightContainerStyle: { paddingRight: 15 },
    headerRight: (
      <View>
        <DisconnectBanner />
      </View>
    ),
  }

  nextScreen = () => {
    navigate(Screens.VerifyEducation)
  }

  onPressEnable = async () => {
    // TODO (Sally) Import contacts duplication
    requestContactsPermission().then((response) => {
      if (response) {
        this.props.importContacts()
      }
      this.nextScreen()
    })
  }

  onPressSkip = () => {
    this.nextScreen()
  }

  render() {
    const { t } = this.props

    return (
      <View style={style.pincodeContainer}>
        <DevSkipButton nextScreen={Screens.VerifyEducation} />
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <View style={style.header} />
          <View>
            <VerifyAddressBook style={style.contactsLogo} />
            <Text style={[fontStyles.h1, style.h1]} testID="ImportContactsPermissionTitle">
              {t('importContactsPermission.title')}
            </Text>
            <View style={style.explanation}>
              <Text style={fontStyles.bodySmall}>{t('importContactsPermission.0')}</Text>
            </View>
            <Text style={[fontStyles.bodySmall, style.explanation]}>
              {t('importContactsPermission.1')}
            </Text>
          </View>
        </ScrollView>
        <View style={style.pincodeFooter}>
          <Button
            text={t('importContactsPermission.enable')}
            onPress={this.onPressEnable}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="importContactsEnable"
          />
          <Button
            text={t('skip')}
            onPress={this.onPressSkip}
            standard={false}
            type={BtnTypes.SECONDARY}
            testID="importContactsSkip"
          />
        </View>
      </View>
    )
  }
}
const style = StyleSheet.create({
  pincodeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    marginHorizontal: 10,
  },
  contactsLogo: {
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  explanation: {
    marginVertical: 10,
    fontWeight: '300',
  },
  pincodeFooter: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'center',
  },
  pincodeFooterText: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 35,
  },
  h1: {
    textAlign: 'center',
  },
  header: {
    margin: 0,
    flexDirection: 'row',
  },
})

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    { importContacts }
  )(withNamespaces(Namespaces.nuxNamePin1)(ImportContacts))
)
