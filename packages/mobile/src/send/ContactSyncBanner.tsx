import Checkmark from '@celo/react-components/icons/Checkmark'
import Error from '@celo/react-components/icons/Error'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import {
  contactMappingProgressSelector,
  isLoadingImportContactsSelector,
} from 'src/identity/reducer'

// TODO Remove this if we don't end up using it in the matchmaking UI
export function ContactSyncBanner() {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const isLoadingContacts = useSelector(isLoadingImportContactsSelector)
  const { total, current } = useSelector(contactMappingProgressSelector)
  const [hasSynced, setHasSynced] = React.useState(false)
  const isSynced = current && total && current >= total

  // Hide banner after 3 seconds when sync is done
  React.useEffect(() => {
    if (!isSynced) {
      return
    }
    const timer = setTimeout(() => {
      setHasSynced(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [isSynced])

  if (!isLoadingContacts && (hasSynced || !total)) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {isLoadingContacts && <ActivityIndicator size="small" color={colors.celoGreen} />}
        {!isLoadingContacts &&
          (isSynced ? (
            <View style={styles.checkmarkContainer}>
              <Checkmark height={28} width={28} />
            </View>
          ) : (
            <Error style={styles.errorContainer} color={colors.errorRed} width={45} />
          ))}
      </View>
      <View style={styles.textContainer}>
        <Text style={fontStyles.bodySmallSemiBold}>{t('contactSyncProgress.header')}</Text>
        <Text style={fontStyles.bodySmall}>
          {total
            ? t('contactSyncProgress.progress', { current, total })
            : t('contactSyncProgress.importing')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomColor: colors.listBorder,
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  textContainer: {
    flexGrow: 1,
    paddingTop: 3,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 25,
  },
  checkmarkContainer: { marginTop: -10 },
  errorContainer: {
    marginLeft: -10,
  },
})
