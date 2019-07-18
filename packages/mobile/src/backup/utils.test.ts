import { createQuizWordList, selectQuizWordOptions } from 'src/backup/utils'

const mockMnemonic =
  'crawl devote harvest aunt ordinary share loyal claim hour degree start tackle layer destroy oil mixture kiss alien food melt link once rival obtain'

jest.mock('react-native-bip39', () => {
  const mockWordList =
    'hair test fire dry loss plead empire crawl devote harvest aunt ordinary proclaim switch result forge false marketing split entertainment moral revise representative medal integration social overeat tourist fitness secure absence dance priority childish chance property rescue land east home clique long define conglomerate lay conscience introduction cage gown adjust precision problem century predict inflation file jury opinion inappropriate refuse pass dive resignation chart revival absorb assignment digital requirement gallon lifestyle scramble handicap country nut glance cooperate smooth institution uncertainty color jam sugar put fold divide executive give habit warn respect gutter radio estate dare poison literacy piece crime theme treasurer lead sensation embarrassment cell tender discrimination grimace city sticky presence bad rib industry personal climate action meaning recession pursuit parking human body belly constant belief fastidious efflux fortune seminar cheese scholar X-ray mouth penny spring referral program earwax write law sweet courtesy exaggerate correction guilt direct impress drop needle disappointment trouser production code blow miracle tired show bowel oil expertise minute locate take miner length lounge understanding experienced strikebreaker eye drown ranch network slide publication favour password dash story dilute kit attention drink copyright retailer generate insistence wake seed eat trade occupation energy disposition petty sample superintendent add freight trainer private cultural bush recommendation cancel chest replace suit curl flock lid chin bend father depend mirror advertise acquit forest auction paint funeral stereotype index finger suspicion convince passive dump Sunday spin unrest dangerous bang sense champion colleague fool creed notion hostage silk trend threat harvest houseplant rush make distort cupboard baby ego weakness function flag queen ankle wrist gesture employee break down formulate cigarette understand lip suppress flush Bible congress cart imperial revolution guerrilla dismissal strength underline basin lighter salmon linen step height engagement castle series Koran pack powder age foreigner brain pigeon offspring cross bait present applaud faith performance acid model move young physics sink memory oven surgeon view wheel disability carriage prosper Europe slant small station correspond describe definition match window glare legislature knowledge food litigation draw material reference invisible decide depression stretch report theorist resource tone gun delete myth glow advance election sensitivity tread correspondence frank bottom dominate limited coup common tragedy kneel list farewell scratch snack shop taste trail lake bat enemy mild fear triangle allowance pay outfit dome gasp wolf top global rank publisher stumble final sulphur economics inhibition brown ice loot active cousin inhabitant frighten nun tablet forward pair cruelty emphasis island error tolerate tough analysis palm carve cool space bacon certain sketch recycle layer fame sip thesis compliance compete rear distinct tray fail silver pie fireplace block demonstrator west flatware light number weave hallway freighter overview fragrant flower accident release day frog hook get herd familiar pleasure test article calendar enhance bake know consultation huge load transport slump unlike evaluate coast pyramid service illustrate toss squash hesitate legislation workshop new charter log intermediate pool presidency swear crowd premature revoke response sharp golf reckless yearn traction cycle smoke eavesdrop abnormal score jealous shelf different dip intelligence red horizon deep athlete pitch obligation ban misplace researcher lock tenant owner consumption profound pupil haunt solve panic pocket grip statement conviction soft sensitive learn party shrink train pace registration aisle activate trial predator whisper relinquish distant advantage arch punch teacher scheme instinct row memorandum impound habitat wreck related pole planet equinox fling sickness due foundation sister end degree trustee inn flow help facade favourite potential burn work out circulate air horror colony virtue motorist appearance bare hostile read extort dividend ratio loose breakdown literature strict compound squeeze greet alive course legend chicken temptation scandal grant determine classify cower soul page punish owl nuclear drawer therapist similar unlawful concentration leak license display deer credit inflate rage economic spy composer trivial bet child opera captivate pig leash import cunning real lemon mobile embox mass modest swop warning sweat weed soar mature way desk establish tooth maid teenager abortion orbit sand dollar acquaintance timber canvas mist personality sleeve infrastructure house paradox chauvinist section asylum monstrous loop bracket treatment conflict rotate initial pick arm tactic arena advertising crouch respectable smash race conventional default deteriorate kick celebration monarch withdraw deputy mutation lot appendix notice surprise middle stem selection brush possible confuse tease conceive bring approach guarantee chapter shy division peace slap straw federation plain south reception continuation marine soap fund convulsion automatic equation curriculum theft waist moment fast brake proportion contain flourish bedroom suite precedent guideline review track variant feast coverage torture represent dark perform admission adopt obscure floor rifle demonstration mine folklore clock sentiment deposit undress front tin halt comfortable chord seem plagiarize captain fish preoccupation hide offset society car lineage partnership theory business elephant mutual countryside grandmother peel reaction ambiguity fluctuation credit card adventure measure fresh speculate metal alcohol proposal glory embryo linger reign promise latest surface title storm bishop essay pierce contrary tasty gossip court snow survey nonremittal string tell agree bird smart battlefield remember mountain king star motif coffin branch perfume board quantity bread class dimension crew green routine manner biscuit slave reserve reduction fine telephone ethics lack produce separate neutral fork information deadly friend resign council roll hostility volunteer school distance normal psychology pleasant settlement casualty birthday cane taxi export hard clinic color-blind sheet witness boat ally charm faithful kill black preparation unpleasant jelly reflection neighborhood debate testify cucumber raise warrant ambiguous bloody breeze demand counter poll funny hill round recovery prize speaker term cemetery speech inquiry remain fur fault discreet nature game climb tap arrangement decorative decoration like jewel shark instruction privilege denial outlet interest twin means scrap college cheek dramatic failure crash crutch dictate company seasonal pressure thumb hobby diameter circle customer governor building node coal supplementary retreat abbey discover rebel abundant senior interrupt attachment reality tongue lose amputate separation thick short circuit initiative nervous ball contrast person science couple acceptable access eternal innocent penalty spray wire vague kinship concert deprive harmony ferry skeleton vegetarian approve profit face survivor arrange application borrow consider monster rubbish culture trolley wrap musical multimedia gap quotation shock tape grain definite steep slippery royalty category venture meeting grow pen obstacle art bridge arise declaration museum fight pudding hear source forestry bow humanity impact'

  return {
    generateMnemonic: (numWords: number) => {
      return mockWordList
        .split(' ')
        .slice(0, numWords)
        .join(' ')
    },
    wordlists: {
      ES: mockWordList,
      EN: mockWordList,
    },
  }
})

describe('backup/utils', () => {
  beforeAll(() => {
    const mockMath = Object.create(global.Math)
    mockMath.random = () => 0.5
    global.Math = mockMath
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
      const wordList = await createQuizWordList(mockMnemonic, 'en')
      const wordOptions = selectQuizWordOptions('crawl', wordList, 4)
      expect(wordOptions.length).toBe(4)
      expect(wordOptions[2]).toBe('crawl')
    })
  })
})
