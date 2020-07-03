import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { setName } from 'src/account/actions'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces, withTranslation } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  name: string | null
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

interface State {
  name: string
}

export class EditProfile extends React.Component<Props, State> {
  state: State = {
    name: this.props.name || '',
  }

  nameValueChange = (name: string) => {
    this.setState({ name })
  }

  nameSubmitted = () => {
    this.props.setName(this.state.name)
    ValoraAnalytics.track(SettingsEvents.settings_profile_name_edit)
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
})(withTranslation<Props>(Namespaces.accountScreen10)(EditProfile))
