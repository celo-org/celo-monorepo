import * as React from 'react'
import { View } from 'react-native'
import Fade from 'react-reveal/Fade'
import FellowshipForm from 'src/fellowship/FellowshipForm'
import FellowViewer from 'src/fellowship/FellowViewer'

export default class FellowSection extends React.PureComponent {
  render() {
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
