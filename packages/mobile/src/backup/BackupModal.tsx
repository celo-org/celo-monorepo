import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Modal from 'react-native-modal'
import { Namespaces } from 'src/i18n'

type Props = {
  isVisible: boolean
  onPress: () => void
} & WithNamespaces

const BackupModal = (props: Props) => {
  const { isVisible, onPress, t } = props
  return (
    <View style={styles.modalContainer}>
      <Modal isVisible={isVisible}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitleText, fontStyles.medium]}>{t('tryAgain')}</Text>
          <Text style={styles.modalContentText}>{t('backToKey')}</Text>
          <View style={styles.modalBottomContainer}>
            <TouchableOpacity onPress={onPress}>
              <Text style={fontStyles.link}>{t('seeBackupKey')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    width: variables.width - 500,
  },
  modalTitleText: {
    marginTop: 20,
    color: colors.dark,
    fontSize: 18,
    paddingHorizontal: 30,
  },
  modalContentText: {
    marginTop: 30,
    color: colors.darkSecondary,
    fontSize: 16,
    paddingHorizontal: 30,
  },
  modalBottomContainer: {
    margin: 30,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
})

export default withNamespaces(Namespaces.backupKeyFlow6)(BackupModal)
