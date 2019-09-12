import * as React from 'react'
import BackupSocial from 'src/backup/BackupSocial'

export default class BackupSocialFirst extends React.Component {
  static navigationOptions = { header: null }

  render() {
    return <BackupSocial partNumber={1} />
  }
}
