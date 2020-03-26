import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { H1 } from 'src/fonts/Fonts';
import OpenGraph from 'src/header/OpenGraph';
import { I18nProps, withNamespaces } from 'src/i18n';
import { Cell, GridRow, Spans } from 'src/layout/GridRow';
import Button, { BTN } from 'src/shared/Button.3';
import { HEADER_HEIGHT } from 'src/shared/Styles';
import { fonts, standardStyles, textStyles } from 'src/styles';

const FAQs = [
  {
    q: 'What is Celo?',
    a: (
      <>
        Celo is an open platform for fast, secure, stable digital payments to any mobile number at a
        fraction of today’s cost. You can learn more{' '}
        <Button text="here" href="https://celo.org" kind={BTN.INLINE} />.
      </>
    ),
  },
  {
    q: 'What is my backup key and is it important?',
    a:
      'Your backup key is *very important* and you must ensure that you don’t lose this. You can retrieve your backup key by going into your “account settings” (this is the gear in the upper right corner of your Wallet screen, and then selecting “Backup Key”). You will have 7 days after you open your wallet to write down this back up key or send it to a trusted friend via Whatsapp.  After you have accessed this backup key, or at the end of 7 days, this backup key will be erased entirely. Wherever you decide to safely write it down and securely store it,  please, do not lose this(!!).',
  },
  {
    q: 'Who should I share my backup key with?',
    a:
      'Should anything happen to your phone, or if you lose access to your wallet, your backup key is the one way in which you can re-open your Celo wallet, and the balances held in that wallet. The Celo app allows you to share your backup key with one other person - and this person should be someone who you deeply trust with your holdings (this could be your partner or a close family member, for instance). Please don’t share this with someone who you only casually know, as it gives the individual access to your Celo balances.',
  },
  {
    q: 'What is an Invitation Code and why do I need one?',
    a:
      'An invitation code is a temporary account pre-loaded with Celo Gold or Celo Dollars. A small fee is needed to verify yourself on the Celo Network, and the invitation code contains the amount to cover this fee.',
  },
  {
    q: 'I lost my phone and can no longer access my wallet - what do I do?',
    a:
      'If you’ve lost your phone, or just generally can’t access your wallet, you’ll need to pull out that handy backup key that you wrote down earlier when you first set up your wallet. Go ahead and download the wallet again from Google Play store, and then tap the “Already have a wallet? Import it” link when you open the app. From there, you’ll be prompted to input in your backup key - and then you should be good to go!',
  },
  {
    q: 'What are Celo Dollars and what is Celo Gold?',
    a:
      'Celo Dollars are a way for you to send and receive value and make social payments to your friends. If you want to say thank you to  your friend for dinner last night, you can send them Celo Dollars. Celo Gold is more like real gold, where there is a fixed supply of it and, consequently, the price can go up or down depending on the demand. You can keep value as Celo Gold or Celo Dollars.',
  },
  {
    q: 'What if I want to invite someone and but don’t want to send them money?',
    a:
      'You can do this! Simply click on your profile settings (the “gear” symbol in the upper right corner). From there, select “Invite Friends”, and send out an invitation to someone you’d like to join the test. Please note that while you don’t need to send them value, you will be required to put forth a small “gas” fee in order to cover the costs to have your friend verified on the network.',
  },
  {
    q: 'What is a “gas” fee, and why am I being charged a fee?',
    a:
      'In order to perform certain transactions, users are required to pay a small “fee” for the actual computations to take place. When you see a “fee”, like when inviting someone for instance, it covers the computational costs of the network.',
  },
  {
    q: 'Can I get the Celo Wallet app on my iPhone?',
    a: 'Not at this time. For now, the Celo Wallet is only available on Android.',
  },
  {
    q: 'What is happening when I verify my phone number?',
    a:
      'The Celo Platform verifies the phone numbers attached to any wallet created. To do this, the Protocol sends 3 text messages with private messages that only you could have received at your phone number. Once your phone confirms these messages, you become verified on the Platform.',
  },
  {
    q: 'What is the difference between my PIN and the backup key?',
    a:
      'Your PIN is like your ATM code, a way to easily get into your wallet and facilitate transactions securely. Your Backup Key is how you can restore your wallet and balances should you ever get locked out or lose your phone. Both of these are important, but your backup key is absolutely critical and should never be lost.',
  },
  {
    q: 'Why do I keep getting prompted for my PIN?',
    a:
      'You’ll need your PIN to access your wallet and balances. There is a PIN in place to keep your wallet secure. If someone else were able to get a hold of your phone for instance, and tried to initiate a large transaction, they would be prompted to enter the PIN. This is a security mechanism, and should be kept private. Once you set your PIN, you won’t be able to change it.',
  },
  {
    q: 'What if my friend never claims their money?',
    a:
      'Make sure that you prompt them to do so! They’ll need to set up a wallet to receive the transaction. If it is not claimed within 5 days, you will see a notification that allows you to either remind them or claim the value back.',
  },
  {
    q: 'What data is celo collecting?',
    a: (
      <>
        Anonymized analytics (no names, phone numbers, or otherwise personally identifying
        information) are collected in the Wallet app. You can always opt out of this by going to the
        Settings page. For more information about the privacy in the Celo Protocol go{' '}
        <Button text="here" href="https://celo.org/privacy" kind={BTN.INLINE} />.
      </>
    ),
  },
  {
    q: 'Why am I seeing my photos from my phone inside of the app?',
    a:
      'If you enable the Celo Wallet app permission to read your contacts’ names and photos, you will see those photos in the Wallet. This enables a more personalized and enhanced experience, and this data will only be available to you on your own device - it is not shared with other users.',
  },
  // {
  //   q: 'What is the Celo Rewards app?',
  //   a: (
  //     <>
  //       The Celo Rewards app is a proof of concept for the identity protocol that would allow for any user
  //       to earn more Celo Gold in the system by actively participating in the verification process of other
  //       users. Users of the app with spare capacity to send text messages, could earn additional value for
  //       sending those verification text messages. Read more about the identity protocol{' '}
  //       <Button text="here" href="https://docs.celo.org/celo-codebase/protocol/identity" kind={BTN.INLINE} />
  //     </>
  //   ),
  // },
  // {
  //   q: 'How do I get more Celo Gold?',
  //   a: (
  //     <>
  //       Please, go ahead and download the Celo Rewards app{' '}
  //       <Button text="here" href="https://celo.org/rewards" kind={BTN.INLINE} />!
  //     </>
  //   ),
  // },
  {
    q: 'Can I cancel a transaction that’s already happened?',
    a:
      'There’s no way to cancel a transaction once it’s already happened, so please be sure that you’re sending value to the right person.',
  },
  {
    q: 'What if the information here doesn’t answer my question?',
    a: (
      <>
        At this point, we’d recommend you email{' '}
        <Button text="community@celo.org" href="mailto:community@celo.org" kind={BTN.INLINE} />
      </>
    ),
  },
]

class FAQ extends React.Component<I18nProps> {
  static getInitialProps() {
    return { namespacesRequired: ['faq', 'common'] }
  }
  render() {
    const { t } = this.props
    return (
      <>
        <OpenGraph title={t('title')} path={'/faq'} description={t('description')} />
        <View style={styles.container}>
          <GridRow
            allStyle={standardStyles.centered}
            desktopStyle={standardStyles.blockMarginBottom}
            tabletStyle={standardStyles.blockMarginBottomTablet}
            mobileStyle={standardStyles.blockMarginBottomMobile}
          >
            <Cell span={Spans.three4th} style={standardStyles.centered}>
              <H1 style={textStyles.center}>{t('title')}</H1>
            </Cell>
          </GridRow>
          {FAQs.map((faq) => <Section key={faq.q} title={faq.q} text={faq.a} />)}
        </View>
      </>
    )
  }
}

function Section({ title, text }) {
  return (
    <GridRow
      desktopStyle={standardStyles.blockMargin}
      tabletStyle={standardStyles.blockMarginTablet}
      mobileStyle={standardStyles.blockMarginMobile}
    >
      <Cell span={Spans.fourth}>
        <Text style={fonts.h3Mobile}>{title}</Text>
      </Cell>
      <Cell span={Spans.half}>
        <Text style={fonts.p}>{text}</Text>
      </Cell>
    </GridRow>
  )
}
export default withNamespaces('faq')(FAQ)

const styles = StyleSheet.create({
  container: {
    marginTop: HEADER_HEIGHT,
    paddingTop: HEADER_HEIGHT,
  },
})
