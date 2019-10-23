import { mnemonicToSeedHex, validateMnemonic } from 'react-native-bip39'
import {
  createQuizWordList,
  formatBackupPhraseOnEdit,
  formatBackupPhraseOnSubmit,
  joinMnemonic,
  MNEMONIC_SPLITTER,
  selectQuizWordOptions,
  splitMnemonic,
} from 'src/backup/utils'

const mockMnemonic =
  'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual'

jest.mock('react-native-bip39', () => {
  const mockWords =
    'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual adapt add addict address adjust admit adult advance advice aerobic affair afford afraid again age agent agree ahead aim air airport aisle alarm album alcohol alert alien all alley allow almost alone alpha already also alter always amateur amazing among amount amused analyst anchor ancient anger angle angry animal ankle announce annual another answer antenna antique anxiety any apart apology appear apple approve april arch arctic area arena argue arm armed armor army around arrange arrest arrive arrow art artefact artist artwork ask aspect assault asset assist assume asthma athlete atom attack attend attitude attract auction audit august aunt author auto autumn average avocado avoid awake aware away awesome awful awkward axis baby bachelor bacon badge bag balance balcony ball bamboo banana banner bar barely bargain barrel base basic basket battle beach bean beauty because become beef before begin behave behind believe below belt bench benefit best betray better between beyond bicycle bid bike bind biology bird birth bitter black blade blame blanket blast bleak bless blind blood blossom blouse blue blur blush board boat body boil bomb bone bonus book boost border boring borrow boss bottom bounce box boy bracket brain brand brass brave bread breeze brick bridge brief bright bring brisk broccoli broken bronze broom brother brown brush bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy butter buyer buzz cabbage cabin cable cactus cage cake call calm camera camp can canal cancel candy cannon canoe canvas canyon capable capital captain car carbon card cargo carpet carry cart case cash casino castle casual cat catalog catch category cattle caught cause caution cave ceiling celery cement census century cereal certain chair chalk champion change chaos chapter charge chase chat cheap check cheese chef cherry chest chicken chief child chimney choice choose chronic chuckle chunk churn cigar cinnamon circle citizen city civil claim clap clarify claw clay clean clerk clever click client cliff climb clinic clip clock clog close cloth cloud clown club clump cluster clutch coach coast coconut code coffee coil coin collect color column combine come comfort comic common company concert conduct confirm congress connect consider control convince cook cool copper copy coral core corn correct cost cotton couch country couple course cousin cover coyote crack cradle craft cram crane crash crater crawl crazy cream credit creek crew cricket crime crisp critic crop cross crouch crowd crucial cruel cruise crumble crunch crush cry crystal cube culture cup cupboard curious current curtain curve cushion custom cute cycle dad damage damp dance danger daring dash daughter dawn day deal debate debris decade december decide decline decorate decrease deer defense define defy degree delay deliver demand demise denial dentist deny depart depend deposit depth deputy derive describe desert design desk despair destroy detail detect develop device devote diagram dial diamond diary dice diesel diet differ digital dignity dilemma dinner dinosaur direct dirt disagree discover disease dish dismiss disorder display distance divert divide divorce dizzy doctor document dog doll dolphin domain donate donkey donor door dose double dove draft dragon drama drastic draw dream dress drift drill drink drip drive drop drum dry duck dumb dune during dust dutch duty dwarf dynamic eager eagle early earn earth easily east easy echo ecology economy edge edit educate effort egg eight either elbow elder electric elegant element elephant elevator elite else embark embody embrace emerge emotion employ empower empty enable enact end endless endorse enemy energy enforce engage engine enhance enjoy enlist enough enrich enroll ensure enter entire entry envelope episode equal equip era erase erode erosion error erupt escape essay essence estate eternal ethics evidence evil evoke evolve exact example excess exchange excite exclude excuse execute exercise exhaust exhibit exile exist exit exotic expand expect expire explain expose express extend extra eye eyebrow fabric face faculty fade faint faith fall false fame family famous fan fancy fantasy farm fashion fat fatal father fatigue fault favorite feature february federal fee feed feel female fence festival fetch fever few fiber fiction field figure file film filter final find fine finger finish fire firm first fiscal fish fit fitness fix flag flame flash flat flavor flee flight flip float flock floor flower fluid flush fly foam focus fog foil fold follow food foot force forest forget fork fortune forum forward fossil foster found fox fragile frame frequent fresh friend fringe frog front frost frown frozen fruit fuel fun funny furnace fury future gadget gain galaxy gallery game gap garage garbage garden garlic garment gas gasp gate gather gauge gaze general genius genre gentle genuine gesture ghost giant gift giggle ginger giraffe girl give glad glance glare glass glide glimpse globe gloom glory glove glow glue goat goddess gold good goose gorilla gospel gossip govern gown grab grace grain grant grape grass gravity great green grid grief grit grocery group grow grunt guard guess guide guilt guitar gun gym habit hair half hammer hamster hand happy harbor hard harsh harvest hat have hawk hazard head health heart heavy hedgehog height hello helmet help hen hero hidden high hill hint hip hire history hobby hockey hold hole holiday hollow home honey hood hope horn horror horse hospital host hotel hour hover hub huge human humble humor hundred hungry hunt hurdle hurry hurt husband hybrid ice icon idea identify idle ignore ill illegal illness image imitate immense immune impact impose improve impulse inch include income increase index indicate indoor industry infant inflict inform inhale inherit initial inject injury inmate inner innocent input inquiry insane insect inside inspire install intact interest into invest invite involve iron island isolate issue item ivory jacket jaguar jar jazz jealous jeans jelly jewel job join joke journey joy judge juice jump jungle junior junk just kangaroo keen keep ketchup key kick kid kidney kind kingdom kiss kit kitchen kite kitten kiwi knee knife knock know lab label labor ladder lady lake lamp language laptop large later latin laugh laundry lava law lawn lawsuit layer lazy leader leaf learn leave lecture left leg legal legend leisure lemon lend length lens leopard lesson letter level liar liberty library license life lift light like limb limit link lion liquid list little live lizard load loan lobster local lock logic lonely long loop lottery loud lounge love'

  const mockWordList = mockWords.split(' ').sort()

  return {
    ...jest.requireActual('react-native-bip39'),
    generateMnemonic: (numWords: number) => {
      return mockWordList.slice(0, numWords).join(' ')
    },
    wordlists: {
      ES: mockWordList,
      EN: mockWordList,
    },
  }
})

describe('createQuizWordList', () => {
  it('creates list correctly without dupes', async () => {
    const wordList = await createQuizWordList(mockMnemonic, 'en')
    expect(wordList.length).toBeGreaterThan(900)
    const wordSet = new Set(wordList)
    const intersection = mockMnemonic.split(' ').filter((w) => wordSet.has(w))
    expect(intersection.length).toBe(0)
  })
})
describe('selectQuizWordOptions', () => {
  it('selects words correctly', async () => {
    global.Math.random = () => 0.5

    const wordList = await createQuizWordList(mockMnemonic, 'en')
    const [correctWord, wordOptions] = selectQuizWordOptions(mockMnemonic, wordList, 4)
    expect(wordOptions).not.toBeUndefined()
    expect(wordOptions!.length).toBe(4)
    expect(mockMnemonic).toContain(correctWord)
  })

  it('does not have duplicates in word options', () => {
    global.Math = Math
    const wordList = ['a', 'b', 'c']
    const [correctWord, wordOptions] = selectQuizWordOptions('d', wordList, 4)
    expect(wordOptions).not.toBeUndefined()
    expect(wordOptions!.length).toBe(4)
    expect(correctWord).toBe('d')
    expect(wordOptions).toEqual(expect.arrayContaining(['a', 'b', 'c', 'd']))
  })
})

describe('mnemonic splitting and joining', () => {
  it('splits mnemonics correctly', () => {
    const shards = splitMnemonic(mockMnemonic, 'en')
    expect(shards.length).toBe(2)
    expect(shards[0]).toBe(
      'abandon ability able about above absent absorb abstract absurd abuse access accident ' +
        MNEMONIC_SPLITTER
    )
    expect(shards[1]).toBe(
      MNEMONIC_SPLITTER +
        ' account accuse achieve acid acoustic acquire across act action actor actress actual'
    )
  })

  it('joins a split mnemonic correctly', () => {
    const split = splitMnemonic(mockMnemonic, 'en')
    const joined = joinMnemonic(split)

    expect(joined).toBe(mockMnemonic)
  })

  it('joins a flipped split mnemonic', () => {
    const split = splitMnemonic(mockMnemonic, 'en').reverse()
    const joined = joinMnemonic(split)

    expect(joined).toStrictEqual(mockMnemonic)
  })
})

describe('Mnemonic validation and formatting', () => {
  const SPANISH_MNEMONIC = 'avance colmo poema momia cofre pata res verso secta cinco tubería yacer eterno observar ojo tabaco seta ruina bebé oral miembro gato suelo violín'.normalize(
    'NFD'
  )

  const BAD_SPANISH_MNEMONIC = 'avance colmo poema momia cofre pata res verso secta cinco tuberia yacer eterno observar ojo tabaco seta ruina bebé oral miembro gato suelo violín'.normalize(
    'NFD'
  )

  const ENGLISH_MNEMONIC =
    'there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband inner surprise invest'

  const MULTILINE_ENGLISH_MNEMONIC = `there resist cinnamon water salmon
spare thumb explain equip uniform control
divorce mushroom head vote below 
setup marriage oval topic husband 
inner surprise invest`

  const MULTILINE_ENGLISH_MNEMONIC_EXTRA_SPACES = MULTILINE_ENGLISH_MNEMONIC.replace(
    'spare',
    '  spare \r\n'
  ).replace('surprise', ' surprise ')

  const MULTILINE_ENGLISH_MNEMONIC_UNTRIMMED_UNCASED =
    '   ' + MULTILINE_ENGLISH_MNEMONIC_EXTRA_SPACES.replace(/s/g, 'S') + '  '

  const BAD_ENGLISH_MNEMONIC =
    'there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband'

  it('formats spacing correctly on edit', () => {
    expect(formatBackupPhraseOnEdit(MULTILINE_ENGLISH_MNEMONIC_EXTRA_SPACES)).toEqual(
      ENGLISH_MNEMONIC
    )
  })

  it('formats spacing correctly on submit', () => {
    expect(formatBackupPhraseOnSubmit(MULTILINE_ENGLISH_MNEMONIC_UNTRIMMED_UNCASED)).toEqual(
      ENGLISH_MNEMONIC
    )
  })

  it('validates spanish successfully', () => {
    expect(validateMnemonic(formatBackupPhraseOnSubmit(SPANISH_MNEMONIC))).toBeTruthy()
  })

  it('validates english successfully', () => {
    expect(validateMnemonic(formatBackupPhraseOnSubmit(ENGLISH_MNEMONIC))).toBeTruthy()
  })

  it('validates english multiline successfully', () => {
    expect(validateMnemonic(formatBackupPhraseOnSubmit(MULTILINE_ENGLISH_MNEMONIC))).toBeTruthy()
  })

  it('does not validate bad english', () => {
    expect(validateMnemonic(formatBackupPhraseOnSubmit(BAD_ENGLISH_MNEMONIC))).toBeFalsy()
  })

  it('does not validate bad spanish', () => {
    expect(validateMnemonic(formatBackupPhraseOnSubmit(BAD_SPANISH_MNEMONIC))).toBeFalsy()
  })

  // See packages/cli/src/utils/key_generator.test.ts for a similar test in the cli
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
      const actualPrivateKey = mnemonicToSeedHex(mnemonics[i])
      expect(actualPrivateKey).toEqual(expectedPrivateKeys[i])
    }
  })
})
