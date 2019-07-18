import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { connect } from 'react-redux'
import { clearMessage } from 'src/app/actions'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  message: string | null
  title?: string | null
  dismissMessageAfter: number | null
}

interface DispatchProps {
  clearMessage: typeof clearMessage
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    message: state.app.message,
    title: state.app.bannerTitle,
    dismissMessageAfter: state.app.dismissMessageAfter,
  }
}

const mapDispatchToProps = {
  clearMessage,
}

export class MessageBanner extends React.Component<Props> {
  render() {
    const { message, dismissMessageAfter, clearMessage: clearMessageAction, title } = this.props

    return (
      <SmartTopAlert
        text={message}
        title={title}
        onPress={clearMessageAction}
        type={NotificationTypes.MESSAGE}
        dismissAfter={dismissMessageAfter}
      />
    )
  }
}

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(MessageBanner)
