import { RootState } from '@celo/mobile/src/redux/reducers'
import Button, { BtnTypes } from '@celo/react-components/components/Button'
import TextButton from '@celo/react-components/components/TextButton'
import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import {
  initiateFigureEightCashout,
  refreshFigureEightEarned,
  setFigureEightAccount,
} from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces, withTranslation } from 'src/i18n'
import { shinyDollar } from 'src/images/Images'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface StateProps {
  figureEightEarned: number | null
  figureEightUserId: string | null
}

interface State {
  userId: string | null
}

interface DispatchProps {
  setFigureEightAccount: typeof setFigureEightAccount
  refreshFigureEightEarned: typeof refreshFigureEightEarned
  initiateFigureEightCashout: typeof initiateFigureEightCashout
  showError: typeof showError
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    figureEightEarned: state.app.figureEightEarned,
    figureEightUserId: state.app.figureEightUserId,
  }
}

type Props = DispatchProps & WithTranslation & StateProps

export class Earn extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: 'cEarn',
  })
  state = {
    userId: this.props.figureEightUserId,
  }

  onSubmitUserId = () => {
    if (this.state.userId) {
      this.props.setFigureEightAccount(this.state.userId)
      this.props.refreshFigureEightEarned()
    } else {
      this.props.showError(ErrorMessages.INVALID_FIGURE_EIGHT_USER_ID)
    }
  }

  onSubmitLogout = () => {
    this.props.setFigureEightAccount('')
    this.props.refreshFigureEightEarned()
  }

  onPressWork = () => {
    Linking.openURL(
      'https://tasks.figure-eight.work/channels/cf_internal/jobs/1551377/work?secret=TnUukIPTIthFxco%2By%2BxIX%2FbVraweCTd8cbCIvw2Ha%2FSE'
    )
  }

  onTransferToWallet = () => {
    this.props.initiateFigureEightCashout()
    // TODO add notification
    navigateHome()
  }

  onChangeInput = (userId: string) => {
    this.setState({ userId })
  }

  componentDidMount = () => {
    this.props.refreshFigureEightEarned()
  }

  render() {
    const amountEarned = this.props.figureEightEarned || 0
    const nonZeroBalance = amountEarned > 0

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
          {this.props.figureEightUserId ? (
            // Complete work when logged in
            <View>
              <View
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={fontStyles.bodyBold}>{`${this.props.figureEightUserId} `}</Text>
                  <TextButton onPress={this.onSubmitLogout}>{'(log out)'}</TextButton>
                </View>
                <TextButton
                  style={fontStyles.body}
                  onPress={this.props.refreshFigureEightEarned}
                >{`$${getMoneyDisplayValue(amountEarned)} available`}</TextButton>
                {nonZeroBalance ? (
                  <>
                    <TextButton style={style.modalSkipText} onPress={this.onTransferToWallet}>
                      {`Transfer total`}
                    </TextButton>
                  </>
                ) : (
                  <></>
                )}
              </View>
            </View>
          ) : (
            // Require log in before displaying work
            <View>
              <Text style={fontStyles.body}>Please enter your userId</Text>
              <TextInput
                onChangeText={this.onChangeInput}
                value={this.state.userId}
                style={style.inputField}
              />
              <TextButton onPress={this.onSubmitUserId}>{'Submit'}</TextButton>
            </View>
          )}
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Image source={shinyDollar} resizeMode={'contain'} style={styles.image} />
            <Text style={styles.h1} testID="VerificationEducationHeader">
              {'Earn cUSD on your phone'}
            </Text>
            <Text style={styles.body}>
              {
                'Complete online tasks and surveys to earn cUSD. Click the link below to get started!'
              }
            </Text>
          </ScrollView>
          <>
            <Button
              text={nonZeroBalance ? 'Continue Working' : 'Start Working'}
              onPress={this.onPressWork}
              standard={false}
              type={BtnTypes.PRIMARY}
              testID="VerificationEducationContinue"
            />
          </>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<any, DispatchProps, {}, RootState>(mapStateToProps, {
    initiateFigureEightCashout,
    refreshFigureEightEarned,
    setFigureEightAccount,
    showError,
  })(withTranslation(Namespaces.accountScreen10)(Earn))
)

const style = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  inputField: {
    marginTop: 25,
    alignItems: 'center',
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    marginBottom: 6,
    paddingLeft: 9,
    color: colors.inactive,
    height: 50,
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  h1: {
    ...fontStyles.h1,
  },
  body: {
    ...fontStyles.bodyLarge,
    textAlign: 'center',
    marginBottom: 20,
  },

  image: {
    height: 120,
    margin: 40,
  },
})
