import Button, { ButtonProps } from '@celo/react-components/components/Button'
import * as React from 'react'
import { connect } from 'react-redux'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'

interface StateProps {
  connected: boolean
}

type Props = StateProps & ButtonProps

const mapStateToProps = (state: RootState): StateProps => ({
  connected: isAppConnected(state),
})

export class GethAwareButton extends React.PureComponent<Props> {
  render() {
    return (
      <Button
        {...this.props}
        disabled={!this.props.connected || this.props.disabled}
        testID={this.props.testID}
      />
    )
  }
}

export default connect(mapStateToProps)(GethAwareButton)
