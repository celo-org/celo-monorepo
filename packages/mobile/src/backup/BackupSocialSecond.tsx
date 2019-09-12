import * as React from 'react'
import BackupSocial from 'src/backup/BackupSocial'
import { headerWithCancelButton } from 'src/navigator/Headers'

export default class BackupSocialFirst extends React.Component {
  static navigationOptions = () => ({
    ...headerWithCancelButton,
  })

  render() {
    return <BackupSocial partNumber={1} />
  }
}
