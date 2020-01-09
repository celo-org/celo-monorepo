import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { setName } from 'src/account/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  name: string
}

interface DispatchProps {
  setName: typeof setName
}

type Props = StateProps & DispatchProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => {
  return {
    name: state.account.name,
  }
}

export class EditProfile extends React.Component<Props> {
  static navigationOptions = headerWithBackButton

  state = {
    name: this.props.name,
  }

  nameValueChange = (name: string) => {
    this.setState({ name })
  }

  onEndEditing = () => {
    CeloAnalytics.track(CustomEventNames.edit_name_input)
  }

  nameSubmitted = () => {
    this.props.setName(this.state.name)
    CeloAnalytics.track(CustomEventNames.edit_name_submit)
    navigate(Screens.Account)
  }

  render() {
    const { t } = this.props
    return (
      <ScrollView style={style.scrollView} keyboardShouldPersistTaps="handled">
        <TextInput
          style={[style.input, fontStyles.regular]}
          underlineColorAndroid={'transparent'}
          autoFocus={true}
          autoCorrect={false}
          placeholder={t('yourName')}
          value={this.state.name}
          onSubmitEditing={this.nameSubmitted}
          onChangeText={this.nameValueChange}
          onEndEditing={this.onEndEditing}
        />
      </ScrollView>
    )
  }
}

const style = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 3,
    borderColor: '#EEEEEE',
    padding: 5,
    height: 54,
    margin: 20,
    width: variables.width - 40,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  setName,
})(withTranslation(Namespaces.accountScreen10)(EditProfile))
