import * as React from 'react'
import { AndroidBackHandler } from 'react-navigation-backhandler'
import BackupSocial from 'src/backup/BackupSocial'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export default class BackupSocialFirst extends React.Component {
  static navigationOptions = { header: null }

  onBackButtonPressAndroid = () => {
    // Override back button to not go back to BackupVerify screen
    navigate(Screens.BackupIntroduction)

    return true
  }

  render() {
    return (
      <>
        <AndroidBackHandler onBackPress={this.onBackButtonPressAndroid} />
        <BackupSocial partNumber={0} />
      </>
    )
  }
}
