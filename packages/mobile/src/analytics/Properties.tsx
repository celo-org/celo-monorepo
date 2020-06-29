import BigNumber from 'bignumber.js'
import { PincodeType } from 'src/account/reducer'
import {
  AppEvents,
  NotificationEvents,
  OnboardingEvents,
  SendEvents,
  SettingsEvents,
} from 'src/analytics/Events'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

export declare type AnalyticsEventProperties<
  AnalyticsPropsList,
  EventName extends keyof AnalyticsPropsList
> = AnalyticsPropsList[EventName] extends undefined ? {} : AnalyticsPropsList[EventName]

export interface AnalyticsPropertiesList {
  [AppEvents.app_launched]: {
    timeElapsed: number
  }
  [AppEvents.app_state_error]: {
    error: string
  }
  [AppEvents.error_displayed]: {
    error: string
  }
  [AppEvents.user_restart]: undefined
  [AppEvents.fetch_balance]: {
    dollarBalance?: BigNumber
    goldBalance?: BigNumber
  }

  [SettingsEvents.edit_profile]: undefined
  [SettingsEvents.edit_name]: undefined
  [SettingsEvents.language_select]: {
    language: string
  }

  [NotificationEvents.celogold_notification_confirm]: undefined
  [NotificationEvents.celogold_notification_dismiss]: undefined
  [NotificationEvents.celorewards_notification_confirm]: undefined
  [NotificationEvents.celorewards_notification_dismiss]: undefined
  [NotificationEvents.invitefriends_notification_confirm]: undefined
  [NotificationEvents.invitefriends_notification_dismiss]: undefined
  [NotificationEvents.incoming_request_payment_decline]: undefined
  [NotificationEvents.incoming_request_payment_pay]: undefined
  [NotificationEvents.incoming_request_payment_review]: undefined
  [NotificationEvents.outgoing_request_payment_review]: undefined
  [NotificationEvents.outgoing_request_payment_remind]: undefined
  [NotificationEvents.outgoing_request_payment_cancel]: undefined
  [NotificationEvents.clicked_escrowed_payment_notification]: undefined
  [NotificationEvents.clicked_escrowed_payment_send_message]: undefined
  [NotificationEvents.get_backup_key]: undefined

  [OnboardingEvents.backup_educate_1_next]: undefined
  [OnboardingEvents.backup_educate_2_next]: undefined
  [OnboardingEvents.backup_educate_3_next]: undefined
  [OnboardingEvents.backup_educate_4_next]: undefined

  [OnboardingEvents.backup_educate_1_cancel]: undefined
  [OnboardingEvents.backup_educate_2_cancel]: undefined
  [OnboardingEvents.backup_educate_3_cancel]: undefined
  [OnboardingEvents.backup_educate_4_cancel]: undefined

  [OnboardingEvents.backup_start]: undefined
  [OnboardingEvents.backup_setup_info]: undefined
  [OnboardingEvents.backup_quiz_backspace]: undefined
  [OnboardingEvents.backup_quiz_submit]: undefined
  [OnboardingEvents.backup_quiz_success]: undefined
  [OnboardingEvents.backup_quiz_incorrect]: undefined

  [OnboardingEvents.delay_backup]: undefined
  [OnboardingEvents.backup_cancel]: undefined
  [OnboardingEvents.backup_cancel_procrastinate]: undefined
  [OnboardingEvents.backup_continue]: undefined
  [OnboardingEvents.backup_setup_toggle_enable]: undefined
  [OnboardingEvents.backup_setup_toggle_disable]: undefined
  [OnboardingEvents.backup_error]: {
    title: string
    context?: string
  }

  [OnboardingEvents.gold_educate_1_next]: undefined
  [OnboardingEvents.gold_educate_2_next]: undefined
  [OnboardingEvents.gold_educate_3_next]: undefined

  [OnboardingEvents.gold_cancel1]: undefined
  [OnboardingEvents.gold_cancel2]: undefined
  [OnboardingEvents.gold_cancel3]: undefined

  [OnboardingEvents.phone_number_set]: {
    countryCode: string
  }
  [OnboardingEvents.invalid_phone_number]: {
    obfuscatedPhoneNumber: string
  }
  [OnboardingEvents.pin_created]: undefined
  [OnboardingEvents.pin_failed_to_set]: {
    pincodeType: PincodeType
    error: string
  }
  [OnboardingEvents.pin_never_set]: {
    pincodeType: PincodeType
  }
  [OnboardingEvents.import_wallet_submit]: undefined

  [SendEvents.send_confirm]: {
    method: 'scan' | 'search'
    localCurrencyExchangeRate: string
    localCurrency: LocalCurrencyCode
    dollarAmount: BigNumber
    localCurrencyAmount: BigNumber
    isInvite: boolean
  }
  [SendEvents.send_scan]: undefined
}
