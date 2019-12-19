import Checkmark from '@celo/react-components/icons/Checkmark'
import Error from '@celo/react-components/icons/Error'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import {
  contactMappingProgressSelector,
  isLoadingImportContactsSelector,
} from 'src/identity/reducer'

export function ContactSyncBanner() {
  const [isVisible, setIsVisible] = React.useState(true)
  const isLoadingContacts = useSelector(isLoadingImportContactsSelector)
  const { total, current } = useSelector(contactMappingProgressSelector)
  const isSynced = current && total && current === total

  // Hide banner after 3 seconds when sync is done
  React.useEffect(
    () => {
      if (!isSynced) {
        return
      }
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 3000)
      return () => clearTimeout(timer)
    },
    [isSynced]
  )

  if (!isVisible) {
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
            <Error color={colors.errorRed} width={45} />
          ))}
      </View>
      <View style={styles.textContainer}>
        <Text style={fontStyles.bodySmallSemiBold}>{'TODO'}</Text>
        <Text style={fontStyles.bodySmall}>{current + ' of ' + total}</Text>
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
})
