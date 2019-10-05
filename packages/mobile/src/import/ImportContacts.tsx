import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { errorSelector } from 'src/alert/reducer'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import VerifyAddressBook from 'src/icons/VerifyAddressBook'
import { denyImportContacts, importContacts } from 'src/identity/actions'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { requestContactsPermission } from 'src/utils/androidPermissions'

interface DispatchProps {
  importContacts: typeof importContacts
  denyImportContacts: typeof denyImportContacts
}

interface StateProps {
  error: ErrorMessages | null
  isLoadingImportContacts: boolean
}

interface State {
  isSubmitting: boolean
}

type Props = WithNamespaces & DispatchProps & StateProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    error: errorSelector(state),
    isLoadingImportContacts: state.identity.isLoadingImportContacts,
  }
}

const displayedErrors = [ErrorMessages.IMPORT_CONTACTS_FAILED]

const hasDisplayedError = (error: ErrorMessages | null) => {
  return error && displayedErrors.includes(error)
}

class ImportContacts extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptionsNoBackButton

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (hasDisplayedError(props.error) && state.isSubmitting) {
      return {
        ...state,
        isSubmitting: false,
      }
    }
    return null
  }

  state = {
    isSubmitting: false,
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.isLoadingImportContacts && !this.props.isLoadingImportContacts) {
      this.nextScreen()
    }
  }

  nextScreen = async () => {
    navigate(Screens.VerifyEducation)
  }

  onPressEnable = async () => {
    this.setState({ isSubmitting: true })
    const result = await requestContactsPermission()
    if (result) {
      this.props.importContacts()
    } else {
      this.onPressSkip()
    }
  }

  onPressSkip = () => {
    this.props.denyImportContacts()
    this.nextScreen()
  }

  render() {
    const { t } = this.props
    const { isSubmitting } = this.state

    return (
      <View style={style.container}>
        <DevSkipButton nextScreen={Screens.VerifyEducation} />
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <View style={style.header} />
          <View>
            <VerifyAddressBook style={style.contactsLogo} />
            <Text style={[fontStyles.h1, style.h1]} testID="ImportContactsPermissionTitle">
              {t('importContactsPermission.title')}
            </Text>
            <Text style={[fontStyles.bodyLarge, fontStyles.center]}>
              {t('importContactsPermission.0')}
            </Text>
            <Text style={[fontStyles.bodyLarge, fontStyles.center, componentStyles.marginTop10]}>
              {t('importContactsPermission.1')}
            </Text>
          </View>
        </ScrollView>
        {isSubmitting && (
          <View style={style.loadingContainer}>
            <ActivityIndicator size="large" color={colors.celoGreen} style={style.activity} />
          </View>
        )}
        <View style={style.footer}>
          <GethAwareButton
            disabled={isSubmitting}
            text={t('importContactsPermission.enable')}
            onPress={this.onPressEnable}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="importContactsEnable"
          />
          <Button
            text={t('global:skip')}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactsLogo: {
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  loadingContainer: {
    marginVertical: 30,
  },
  loadingLabel: {
    textAlign: 'center',
    color: colors.darkSecondary,
  },
  footer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    textAlign: 'center',
  },
  h1: {
    textAlign: 'center',
  },
  header: {
    margin: 0,
    flexDirection: 'row',
  },
  activity: {
    marginTop: 15,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      importContacts,
      denyImportContacts,
    }
  )(withNamespaces(Namespaces.nuxNamePin1)(ImportContacts))
)
