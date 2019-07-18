import { DefaultEventNames } from '@celo/react-components/analytics/constants'

export enum CustomEventNames {
  user_restart = 'user_restart',

  // Screen name: Rewards_Welcome
  welcome_next = 'welcome_next', // (count # of taps happen on the “Next” button in Rewards_Welcome)
  welcome_language = 'welcome_language', // (capture the input of the language selected in the form)
  welcome_continue = 'welcome_continue', // (count # of taps on the “Continue” button)

  // Screen name: Rewards_Notifications
  sms_allow = 'sms_allow', // (count # of taps on “Allow” permission in Rewards_Notifications)
  sms_deny = 'sms_deny', // (count # of taps on “Deny” permission in Rewards_Notifications)
  // TODO Dont think we can track this native operation
  dont_ask_sms = 'dont_ask_sms', // (count # of times “Don’t ask again” is checked in Rewards_Notifications)

  // Screen name: Rewards_Setup
  full_name_setup = 'full_name_setup', // (capture the input for the full name of the “Name” form field in Rewards_Setup)
  country_setup = 'country_setup', // (capture the input of the country selected in Rewards_Setup)
  phone_setup = 'phone_setup', // (capture the input of the phone form input field in Rewards_Setup)
  setup_continue = 'setup_continue', // (capture # of times the “Continue” is tapped to proceed)

  // Screen name: Rewards_Home
  verifying_on = 'verifying_on', // (to track # of taps on the button selector that result in verifying being “on”)
  verifying_off = 'verifying_off', // (to track # of taps on the button selector that result in verifying being “off”)
  profile_view = 'profile_view', // (to measure # of taps on gear in the upper right corner of the Home page)
  // TODO waiting on kamyar/rossy prs
  reward_closeup = 'reward_closeup', // (to track # of taps on the reward distribution event to see drilldown)
  reward_exit = 'reward_exit', // (to track # of taps on “X” to exit out of the drilldown view)

  // Rewards_Account
  // TODO feature not created
  photo_upload = 'photo_upload', // (to measure # of taps on the “ChangeUpdate Profile Photo” in Rewards_Account)

  edit_profile = 'edit_profile', // (to measure # of taps to change the Profile # from Rewards_Account)
  edit_language = 'edit_language', // records when users go from profile to language page

  // Profile Page
  new_phone_country = 'new_phone_country', // (captures input value of the updated country value)
  new_phone_number = 'new_phone_number', // (captures input value of the updated phone #)
  new_name = 'new_name', // (captures input value of the updated name #)
  submit_profile_update = 'submit_profile_update', // captures when user presses submit button to confirm change of name and/or number

  // Language Page
  new_language = 'new_language', // (capture the input of the language selected in the form)
  submit_language = 'submit_language', // (count # of taps on the “Continue” button)
}

// REMOVE name and number at end of Pilot
export const PROPERTY_PATH_WHITELIST = ['name', 'number', 'valid', 'lang', 'countryCode']
export { DefaultEventNames }
