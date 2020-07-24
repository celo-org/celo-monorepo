import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import Switch from '@celo/react-components/components/Switch'
import TextInput from '@celo/react-components/components/TextInput.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { anonymizedPhone } from '@celo/utils/src/phoneNumbers'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { openComposer } from 'react-native-email-link'
import * as RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { showMessage } from 'src/alert/actions'
import { sessionIdSelector } from 'src/app/selectors'
import { CELO_SUPPORT_EMAIL_ADDRESS, DEFAULT_TESTNET } from 'src/config'
import { Namespaces } from 'src/i18n'
import { navigateBack } from 'src/navigator/NavigationService'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

interface Email {
  subject: string
  recipients: [string]
  body: string
  isHTML: boolean
  attachment?: {
    path: string
    type: string
    name: string
  }
}

async function sendEmailWithNonNativeApp(
  emailSubect: string,
  message: string,
  deviceInfo: {},
  combinedLogsPath?: string | false
) {
  try {
    const supportLogsMessage = combinedLogsPath
      ? `Support logs: ${!combinedLogsPath || (await RNFS.readFile(combinedLogsPath))}`
      : ''
    await openComposer({
      to: CELO_SUPPORT_EMAIL_ADDRESS,
      subject: emailSubect,
      body: `${message}\n${JSON.stringify(deviceInfo)}\n${supportLogsMessage}`,
    })
    return { success: true }
  } catch (error) {
    return { error }
  }
}

function SupportContact() {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const [message, setMessage] = useState('')
  const [attachLogs, setAttachLogs] = useState(true)
  const [inProgress, setInProgress] = useState(false)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const currentAccount = useSelector(currentAccountSelector)
  const sessionId = useSelector(sessionIdSelector)
  const dispatch = useDispatch()

  const navigateBackAndToast = () => {
    navigateBack()
    dispatch(showMessage(t('contactSuccess')))
  }

  const sendEmail = useCallback(async () => {
    setInProgress(true)
    const deviceInfo = {
      version: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      apiLevel: DeviceInfo.getApiLevelSync(),
      deviceId: DeviceInfo.getDeviceId(),
      address: currentAccount,
      sessionId,
      network: DEFAULT_TESTNET,
    }
    const userId = e164PhoneNumber ? anonymizedPhone(e164PhoneNumber) : 'unknown'
    const emailSubject = 'Celo support for ' + (userId || 'unknownUser')
    const email: Email = {
      subject: emailSubject,
      recipients: [CELO_SUPPORT_EMAIL_ADDRESS],
      body: `${message}<br/><br/><b>${JSON.stringify(deviceInfo)}</b>`,
      isHTML: true,
    }
    let combinedLogsPath: string | false
    if (attachLogs) {
      combinedLogsPath = await Logger.createCombinedLogs()
      if (combinedLogsPath) {
        email.attachment = {
          path: combinedLogsPath, // The absolute path of the file from which to read data.
          type: 'text', // Mime Type: jpg, png, doc, ppt, html, pdf, csv
          name: '', // Optional: Custom filename for attachment
        }
        email.body += (email.body ? '<br/><br/>' : '') + '<b>Support logs are attached...</b>'
      }
    }
    setInProgress(false)

    // Try to send with native mail app with logs as attachment
    // if fails user can choose mail app but logs sent in message
    Mailer.mail(email, async (error: any, event: string) => {
      if (event === 'sent') {
        navigateBackAndToast()
      } else if (error) {
        const emailSent = await sendEmailWithNonNativeApp(
          emailSubject,
          message,
          deviceInfo,
          combinedLogsPath
        )
        if (emailSent.success) {
          navigateBackAndToast()
        } else {
          Logger.showError(error + ' ' + emailSent.error)
        }
      }
    })
  }, [message, attachLogs, e164PhoneNumber])

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={styles.title} testID={'ContactTitle'}>
          {t('contact')}
        </Text>
        <Text style={styles.headerText}>{t('global:message')}</Text>
        <TextInput
          onChangeText={setMessage}
          value={message}
          multiline={true}
          style={styles.messageTextInput}
          placeholderTextColor={colors.gray4}
          underlineColorAndroid="transparent"
          numberOfLines={10}
          placeholder={t('contactMessagePlaceholder')}
          showClearButton={false}
          testID={'MessageEntry'}
        />
        <View style={styles.attachLogs}>
          <Switch
            testID="SwitchLogs"
            style={styles.logsSwitch}
            value={attachLogs}
            onValueChange={setAttachLogs}
          />
          <Text style={fontStyles.regular}>{t('attachLogs')}</Text>
        </View>
        {inProgress && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{t('supportLegalCheckbox')}</Text>
        </View>
        <Button
          disabled={!message || inProgress}
          onPress={sendEmail}
          text={t('global:submit')}
          type={BtnTypes.PRIMARY}
          testID="SubmitContactForm"
        />
      </ScrollView>
      <KeyboardSpacer />
    </View>
  )
}

const styles = StyleSheet.create({
  disclaimer: {
    marginBottom: 24,
  },
  disclaimerText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flexGrow: 1,
    padding: 16,
  },
  containerList: {
    paddingLeft: 20,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
  },
  contactUs: {
    marginTop: 30,
    alignItems: 'center',
  },
  attachLogs: {
    flexShrink: 0,
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    marginTop: 4,
  },
  logsSwitch: {
    marginBottom: 3,
    marginRight: 10,
  },
  messageTextInput: {
    ...fontStyles.regular,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.gray2,
    borderRadius: 4,
    borderWidth: 1.5,
    marginBottom: 4,
    color: colors.dark,
    height: 80,
    maxHeight: 150,
  },
  headerText: {
    ...fontStyles.small600,
  },
  loadingSpinnerContainer: {
    marginVertical: 20,
  },
  title: {
    ...fontStyles.h1,
    marginVertical: 16,
  },
})

export default SupportContact
