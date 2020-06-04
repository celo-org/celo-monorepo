import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Switch from '@celo/react-components/components/Switch.v2'
import TextButton from '@celo/react-components/components/TextButton.v2'
import colors from '@celo/react-components/styles/colors'
import colorsV2 from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { Namespaces, withTranslation } from 'src/i18n'
import { importContacts } from 'src/identity/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'

interface DispatchProps {
  importContacts: typeof importContacts
}

type Props = WithTranslation & DispatchProps

interface State {
  isFindMeSwitchChecked: boolean
}

const mapDispatchToProps = {
  importContacts,
}

class ImportContactScreen extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    isFindMeSwitchChecked: true,
  }

  onPressConnect = () => {
    // TODO do matchmaking if isFindMeSwitchChecked
    this.props.importContacts()
  }

  onPressSkip = () => {
    // TODO update state to not come back here
    // TODO show some interstitial before home?
    navigateHome()
  }

  onToggleFindMeSwitch = (value: boolean) => {
    this.setState({
      isFindMeSwitchChecked: value,
    })
  }

  render() {
    const { isFindMeSwitchChecked } = this.state
    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.h1} testID="ImportContactsScreenHeader">
            {t('contacts.header')}
          </Text>
          <Text style={styles.body}>{t('contacts.body')}</Text>
          <View style={styles.switchContainer}>
            <Switch value={isFindMeSwitchChecked} onValueChange={this.onToggleFindMeSwitch} />
            <Text style={styles.switchText}>{t('contacts.findSwitch')}</Text>
          </View>
          <Button
            onPress={this.onPressConnect}
            text={t('global:connect')}
            size={BtnSizes.MEDIUM}
            type={BtnTypes.SECONDARY}
          />
        </ScrollView>
        <View style={styles.bottomButtonContainer}>
          <TextButton onPress={this.onPressSkip} style={styles.bottomButtonText}>
            {t('global:skip')}
          </TextButton>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
    justifyContent: 'center',
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
    textAlign: 'left',
  },
  body: {
    ...fontStyles.bodyLarge,
  },
  switchContainer: {
    marginVertical: 20,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  switchText: {
    ...fontStyles.bodyLarge,
    paddingTop: 2,
    paddingLeft: 8,
  },
  bottomButtonContainer: {
    margin: 30,
    alignItems: 'center',
  },
  bottomButtonText: {
    color: colorsV2.gray5,
  },
})

export default connect<{}, DispatchProps>(
  null,
  mapDispatchToProps
)(withTranslation(Namespaces.onboarding)(ImportContactScreen))
