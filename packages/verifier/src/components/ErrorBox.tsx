import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import { clearError } from 'src/app/actions'
import { errorMessages } from 'src/app/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  error: errorMessages | null
  dismissErrorAfter: number | null
}

interface DispatchProps {
  clearError: typeof clearError
}

type Props = StateProps & WithNamespaces & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    error: state.app.error,
    dismissErrorAfter: state.app.dismissErrorAfter,
  }
}

const mapDispatchToProps = {
  clearError,
}

export class ErrorBox extends React.Component<Props> {
  render() {
    const { t, error, dismissErrorAfter, clearError: clearErrorAction } = this.props

    return (
      <SmartTopAlert
        text={error && t(error)}
        onPress={clearErrorAction}
        type={NotificationTypes.ERROR}
        dismissAfter={dismissErrorAfter}
      />
    )
  }
}

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces('global')(ErrorBox))
