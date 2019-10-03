import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import FellowshipForm from 'src/fellowship/FellowshipForm'
import FellowViewer from 'src/fellowship/FellowViewer'
import { I18nProps, withNamespaces } from 'src/i18n'

class FellowSection extends React.PureComponent<I18nProps> {
  render() {
    const { t } = this.props
    return (
      <>
        <FellowViewer />

        <Fade bottom={true} distance={'20px'}>
          <View>
            <FellowshipForm />
          </View>
        </Fade>
      </>
    )
  }
}

export default withNamespaces('community')(FellowSection)
