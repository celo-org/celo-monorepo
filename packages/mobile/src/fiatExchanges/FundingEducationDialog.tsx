import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import Dialog from 'src/components/Dialog'
import { FUNDING_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import { navigateToURI } from 'src/utils/linking'

interface Props {
  isVisible: boolean
  onPressDismiss: () => void
}

export default function FundingEducationDialog({ isVisible, onPressDismiss }: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const link = FUNDING_LINK

  const onPressSupportLink = () => {
    navigateToURI(link)
    // Wait a bit before dismissing to prevent a UI glitch with the popup
    // while the app transitions to the browser
    setTimeout(() => onPressDismiss(), 10)
  }

  return (
    <Dialog
      title={t('fundingEducationDialog.title')}
      isVisible={isVisible}
      actionText={t('fundingEducationDialog.dismiss')}
      actionPress={onPressDismiss}
    >
      <Trans
        i18nKey="fundingEducationDialog.body"
        ns={Namespaces.fiatExchangeFlow}
        values={{
          // Don't show the scheme in the link
          link: link.replace(/^https?:\/\//, ''),
        }}
      >
        <Text style={styles.link} onPress={onPressSupportLink} />
      </Trans>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  link: {
    color: colors.greenUI,
  },
})
