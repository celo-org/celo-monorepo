import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Namespaces, withTranslation } from 'src/i18n'
import { RootState } from 'src/redux/reducers'

const DISMISS_DEFAULT = 5

interface OwnProps {
  error?: ErrorMessages | null
  dismissAfter?: number | null
}

interface DispatchProps {
  hideAlert: typeof hideAlert
}

const mapDispatchToProps = {
  hideAlert,
}

type Props = DispatchProps & OwnProps & WithTranslation

function ErrorMessageInline(props: Props) {
  const { error, dismissAfter, t } = props

  // Keep the space empty when there isn't an error
  if (!error) {
    return <View style={styles.errorContainer} />
  }

  if (dismissAfter !== null) {
    setTimeout(props.hideAlert, (dismissAfter || DISMISS_DEFAULT) * 1000)
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorMessage}>{t(error)} </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    height: 64,
  },
  errorMessage: {
    ...fontStyles.small,
    color: colors.warning,
  },
})

export default connect<{}, DispatchProps, {}, RootState>(
  (state: RootState) => ({}),
  mapDispatchToProps
)(withTranslation(Namespaces.global)(ErrorMessageInline))
