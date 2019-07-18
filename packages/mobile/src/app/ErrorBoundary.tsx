import { getErrorMessage } from '@celo/utils/src/displayFormatting'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Sentry } from 'react-native-sentry'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { DefaultEventNames } from 'src/analytics/constants'
import ErrorScreen from 'src/app/ErrorScreen'

interface State {
  childError: Error | null
}

interface OwnProps {
  children: React.ReactChild
}

type Props = OwnProps & WithNamespaces

class ErrorBoundary extends React.Component<Props, State> {
  state = {
    childError: null,
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ childError: error })
    CeloAnalytics.track(DefaultEventNames.errorDisplayed, { error }, true)
    Sentry.captureException(error)
  }

  render() {
    const { childError } = this.state
    if (childError) {
      return <ErrorScreen errorMessage={getErrorMessage(childError)} />
    }

    return this.props.children
  }
}

export default withNamespaces('global')(ErrorBoundary)
