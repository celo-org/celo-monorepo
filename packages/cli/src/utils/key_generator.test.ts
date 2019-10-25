import { validateMnemonic } from 'bip39'
import { ReactNativeBip39MnemonicGenerator } from './key_generator'

describe('Mnemonic validation', () => {
  it('should generatet 24 word mnemonic', () => {
    const mnemonic: string = ReactNativeBip39MnemonicGenerator.generateMnemonic()
    expect(mnemonic.split(' ').length).toEqual(24)
  })

  // See packages/mobile/src/import/ImportWallet.test.tsx for a similar test in the mobile codebase
  it('should generate an expected private key for a mnemonic', () => {
    // 10 random mnemonic
    const mnemonics = [
      'language quiz proud sample canoe trend topic upper coil rack choice engage noodle panda mutual grab shallow thrive forget trophy pull pool mask height',
      'law canoe elegant tuna core tired flag scissors shy expand drum often output result exotic busy smooth dumb world obtain nominee easily conduct increase',
      'second inside foot legend direct bridge human diesel exotic regular silent trigger multiply prosper involve bulb swarm oppose police forest tooth ankle hungry diesel',
      'tide artist other purpose mobile provide arena fantasy sad loop trim oxygen employ solar urban gentle turkey property size airport message mountain phrase music',
      'enjoy weapon window bike alley label demand kingdom sniff bitter student under best motor manual rough cry salad shoot again laptop peanut vehicle misery',
      'flavor cereal pause sort useless old foot section service history cradle bind acid exhibit into inch report primary license wire chief crumble service feature',
      'grid cash lift will travel token silver super valley where unfair couple robot replace special coach symptom major loyal ticket witness divide reflect analyst',
      'purse build cash maple eyebrow gadget brave during carbon word tumble canal panda march rough load open enhance lady square vessel decrease toy possible',
      'love regular blood road latin uncle shuffle hill aerobic cushion robust million elder gather clip unique pupil escape frost myth glove gadget pitch february',
      'gasp eyebrow sibling dash armed guess excuse ball whip thunder insane pause lizard excuse air catalog tail control raise test dutch permit magic under',
    ]
    const expectedPrivateKeys = [
      'd4ee6eaffae6ef23f67fef0407d92ba314c564b78089ed68da490622b7a71a48',
      'cd95449d68566374969b51993bdf1115b752b03b5a17886f28e640ccee001b1f',
      '042c106256dfc3b3ecb15f9b146a4696f5c0f0f0fdb5094207dd5e0705753aa9',
      'ea85a0a007e28ed7233cdac32677245bb539328b411eff85e1fe17ee2991ea8f',
      'b1ffe504d2ef5ea363d5b4b33a068955f9b8b20d724d6ce7596aee2fe22b709f',
      '8d9ca5c124f190689a75283f75a39db87ffb72784378a5c5873de900daa847cd',
      'da7760fe8fbc1f5cafd94a82915d2df7d0303f3519dfadbebf48e69fdb84d344',
      '452c5d80c71dc95285ab889b1b3bb6ec8edeac15a25d78c5ac67910bc27f58fc',
      '86ad34026463e53c813341e4f95e2fc9c87ea7b02612d3968087ef23fdf6d18d',
      'ee4f9be9ac86beddff059500b4f8d4f60828f930bf2644e320e58f6a87b03320',
    ]
    expect(mnemonics.length).toEqual(expectedPrivateKeys.length)
    for (let i = 0; i < mnemonics.length; i++) {
      expect(validateMnemonic(mnemonics[i])).toBeTruthy()
      const actualPrivateKey = ReactNativeBip39MnemonicGenerator.mnemonicToSeedHex(mnemonics[i])
      expect(actualPrivateKey).toEqual(expectedPrivateKeys[i])
    }
  })
})
