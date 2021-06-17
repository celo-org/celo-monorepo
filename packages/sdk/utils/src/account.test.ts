import { MnemonicLanguages } from '@celo/base/lib/account'
import * as bip39 from 'bip39'
import {
  generateKeys,
  generateMnemonic,
  getAllLanguages,
  invalidMnemonicWords,
  MnemonicStrength,
  normalizeMnemonic,
  suggestMnemonicCorrections,
  validateMnemonic,
} from './account'

describe('AccountUtils', () => {
  describe('.generateMnemonic()', () => {
    it('should generate 24 word mnemonic', async () => {
      const mnemonic: string = await generateMnemonic()
      expect(mnemonic.split(/\s+/g).length).toEqual(24)
    })

    it('should generate 12 word mnemonic', async () => {
      const mnemonic: string = await generateMnemonic(MnemonicStrength.s128_12words)
      expect(mnemonic.split(/\s+/g).length).toEqual(12)
    })

    for (const language of getAllLanguages()) {
      const languageName = MnemonicLanguages[language]

      it(`should generate a valid mnemonic in ${languageName}}`, async () => {
        const mnemonic = await generateMnemonic(undefined, language)
        expect(mnemonic.split(/\s+/g).length).toEqual(24)
        // This validates against all languages
        expect(validateMnemonic(mnemonic)).toBeTruthy()
        // This validates using a specific wordlist
        expect(bip39.validateMnemonic(mnemonic, bip39.wordlists[languageName])).toBeTruthy()
      })
    }
  })

  describe('.validateMnemonic()', () => {
    const testMnemonics = {
      [MnemonicLanguages.chinese_simplified]:
        '唐 即 驶 橡 钙 六 码 卸 擦 批 培 拒 磨 励 累 栏 砍 霞 弃 卫 中 空 罩 尘',
      [MnemonicLanguages.chinese_traditional]:
        '微 款 輩 除 雕 將 鑽 蕭 奇 波 掃 齒 弱 誣 氫 兩 證 漸 堡 亦 攝 了 坯 材',
      [MnemonicLanguages.english]:
        'grid dove lift rib rose grit comfort delay moon crumble sell adapt rule food pull loan puppy okay palace predict grass hint repair napkin',
      [MnemonicLanguages.french]:
        'texte succès lexique frégate sévir oiseau lanceur souvenir mythique onirique pélican opérer foulure enfouir maintien vexer relief aérer citerne ligoter arbitre gomme sénateur dénouer',
      [MnemonicLanguages.italian]:
        'leone sinistro nicchia mole tromba celebre parcella pillola golf voga ostacolo relazione peso unificato tristezza brezza merenda trasloco pinolo persuaso querela pomice onere premere',
      [MnemonicLanguages.japanese]:
        'へきが　けねん　したうけ　せんさい　けいさつ　めんきょ　せりふ　ひびく　せあぶら　たいむ　そこう　うさぎ　つながる　はんろん　むいか　せはば　すべる　りりく　はいれつ　たいる　りかい　さたん　はっかく　ひしょ',
      [MnemonicLanguages.korean]:
        '보장 검사 장기간 문득 먼저 현지 쇼핑 재정 예금 녹화 연세 도덕 정말 불빛 사생활 재능 활동 불빛 경험 소형 고등학생 철저히 공원 증세',
      [MnemonicLanguages.spanish]:
        'cordón soplar santo teoría arpa ducha secreto margen brisa anciano maldad colgar atún catre votar órgano bebida ecuador rabia maduro tubo faja avaro vivero',
      [MnemonicLanguages.portuguese]:
        'cheiro lealdade duplo oposto vereador acessar lanche regra prefeito apego ratazana piedade alarme marmita subsolo brochura honrado viajar magnata canoa sarjeta terno cimento prezar',
    }

    for (const language of getAllLanguages()) {
      const languageName = MnemonicLanguages[language]

      it(`should validate a mnemonic in ${languageName}`, () => {
        const mnemonic = testMnemonics[language]
        expect(mnemonic).toBeDefined()

        // This validates against all languages
        expect(validateMnemonic(mnemonic)).toBeTruthy()
        // This validates using a specific wordlist
        expect(bip39.validateMnemonic(mnemonic, bip39.wordlists[languageName])).toBeTruthy()
      })
    }
  })

  describe('.generateKeys()', () => {
    it('should generate an expected private key for a mnemonic', async () => {
      // 3 random mnemonic
      const mnemonics = [
        'language quiz proud sample canoe trend topic upper coil rack choice engage noodle panda mutual grab shallow thrive forget trophy pull pool mask height',
        'law canoe elegant tuna core tired flag scissors shy expand drum often output result exotic busy smooth dumb world obtain nominee easily conduct increase',
        'second inside foot legend direct bridge human diesel exotic regular silent trigger multiply prosper involve bulb swarm oppose police forest tooth ankle hungry diesel',
      ]
      const expectedPrivateKeys = [
        {
          derivation0: {
            address: '0xe13E391f19193DB38AeA975a30193E50fBff381f',
            privateKey: '9b20170cd294190efb2eb1d406a51e6705461cb540e777784565c1d8342016d7',
            publicKey: '0257780786b4ba7bf47b3be6082f65069f552012735a17c2080648de67cfb440c1',
          },
          derivation1: {
            address: '0x9a85EBC698647895a1e12544E9B1751Aed57f9F4',
            privateKey: '29c025cda952cb59d8504cca390bcdbc2cc3706ca5bfb65a5b6f5dd5dc5176dd',
            publicKey: '029c90f394bea3d46c46896b0bd1b36119b031a6da498b49a32aad77f10ce1f672',
          },
          password: {
            address: '0x1546D345F7A5Cf533290fd54833de1Ce0552A2d7',
            privateKey: '92956ef74d530224029380385ca556240be042b7e5592ffece5945286f1562c3',
            publicKey: '0331003f16d42ea996da1bc91188ff170ea451570a9bed4779682dd27da1892303',
          },
        },
        {
          derivation0: {
            address: '0xCA388713E3741d9Bf938D6370a94F80766A22530',
            privateKey: 'eb0fea0b0aab13e4115939e2af62a5f136cdeefa1f0480c5550b93550339857d',
            publicKey: '0279548f9e2b8fbbeb91865068257de240fa307d479c94926a32e33f8707c70497',
          },
          derivation1: {
            address: '0x5bA0350E8a681b0fe3D939633B5514A9A6152f81',
            privateKey: 'cd2aa97d2bf6ddac4f00513eb08de8d40dcff4106508d18ea995ffbff8166420',
            publicKey: '03e4784248f6c4b3bacf8090f67d002e58f4da448bb9b993432fe226abdcd5c83f',
          },
          password: {
            address: '0x9A78acd4C77c796C3d657f17F3D05cd46eFCC5bE',
            privateKey: '62c928058f72e5a04abcf5e46035d5f0933f996285ec25b3bc9d2b9fc907dc56',
            publicKey: '0240d5adc5c0ce46f3488401e3ea78a261de1cd8a8e6a1d9e55386c6c4881b70ec',
          },
        },
        {
          derivation0: {
            address: '0x64265716715822ff47025B0c06478C0FADaf9c6E',
            privateKey: 'bfc514b7a895cade755f65196b4807a0635381ee16195b33e22b919ecaedf553',
            publicKey: '034ca1fb554b952b6794da020c8d101527a2a91884dbab671211ce77b2ec3f1a3e',
          },
          derivation1: {
            address: '0xff1ef005f5A11426343D3492d73e94bad169d900',
            privateKey: '074e6edfc31f8ccfd93427d204da5ada15124a25fde119b7f65b54ff283b6207',
            publicKey: '03606b5f63932b2a896c3fb3aa7f60f0f5aa9cd7ce8310199cae2c06514159f799',
          },
          password: {
            address: '0xb73C6AaDb67238323d811469A95E8e2B92cC0B4A',
            privateKey: '743594169177ae8ab3dd08a6e22842a2ac43dbe886a73eebc33cd21e73175661',
            publicKey: '03aa657da15ceb192b73a3aa3a36512a765d9c9751763dd7801585fba8d10f7467',
          },
        },
      ]
      expect(mnemonics.length).toEqual(expectedPrivateKeys.length)
      for (let i = 0; i < mnemonics.length; ++i) {
        expect(validateMnemonic(mnemonics[i])).toBe(true)
        const derivation0 = await generateKeys(mnemonics[i])
        const derivation1 = await generateKeys(mnemonics[i], undefined, 0, 1)
        const password = await generateKeys(mnemonics[i], 'password')
        expect({ derivation0, derivation1, password }).toEqual(expectedPrivateKeys[i])
      }
    })
  })

  describe('.normalizeMnemonic()', () => {
    it('should normalize phrases with and without accents', () => {
      const spanishMnemonics = [
        'yerno obvio niñez pierna bebé pomelo retorno flujo sacar odio oxígeno rabo', // Correctly accented.
        'yerno obvio niñez pierna bebé pomelo retorno flujo sacar odio oxigeno rabo', // Missing 1 accent.
        'yerno obvio niñez pierna bebe pomelo retorno flujo sacar odio oxígeno rabo', // Missing 1 accent.
        'yerno obvio ninez pierna bebe pomelo retorno flujo sacar odio oxígeno rabo', // Missing 2 accents.
        'yerno obvio ninez pierna bebe pomelo retorno flujo sacar odio oxigeno rabo', // Missing all 3 accents.
        'yérno obvio ninez pierña bebe pomelo retorno flujo sacar odio oxigéno rabo', // Incorrect accents.
      ]
      const expectedMnemonic = spanishMnemonics[0]

      for (const mnemonic of spanishMnemonics) {
        expect(normalizeMnemonic(mnemonic)).toEqual(expectedMnemonic)
      }
    })

    it('should not normalize accents when the word is from a different language', () => {
      // Cases include French mnemonic, missing one accent, and a single Spanish word mixed in, without proper accent.
      const cases = [
        {
          mnemonic:
            'declarer effrayer estime carbone bebe danger déphaser junior buisson ériger morceau cintrer',
          language: undefined,
          expected:
            'déclarer effrayer estime carbone bebe danger déphaser junior buisson ériger morceau cintrer',
        },
        {
          mnemonic:
            'declarer effrayer estime carbone bebe danger déphaser junior buisson ériger morceau cintrer',
          language: MnemonicLanguages.french,
          expected:
            'déclarer effrayer estime carbone bebe danger déphaser junior buisson ériger morceau cintrer',
        },
        // Expect that it will not try to normalize accents for words not in the given language.
        {
          mnemonic:
            'declarer effrayer estime carbone bebe danger déphaser junior buisson ériger morceau cintrer',
          language: MnemonicLanguages.spanish,
          expected:
            'declarer effrayer estime carbone bebé danger déphaser junior buisson ériger morceau cintrer',
        },
      ]

      for (const { mnemonic, language, expected } of cases) {
        expect(normalizeMnemonic(mnemonic, language)).toEqual(expected)
      }
    })

    it('should normalize capitalized words to lowercase', () => {
      const mnemonic =
        'female cousin RAPID exotic ribbon level equiP LeGal fuN RIVER hotel duTy TRIP youth rebel'
      const expected =
        'female cousin rapid exotic ribbon level equip legal fun river hotel duty trip youth rebel'
      expect(normalizeMnemonic(mnemonic)).toEqual(expected)
    })

    it('should normalize extra and non-standard whitespace', () => {
      const mnemonic =
        ' \tfemale   cousin rapid exotic\nribbon level\u3000equip   legal fun river hotel duty trip youth rebel'
      const expected =
        'female cousin rapid exotic ribbon level equip legal fun river hotel duty trip youth rebel'
      expect(normalizeMnemonic(mnemonic)).toEqual(expected)
    })

    it('should normalize extra and non-standard whitespace', () => {
      const mnemonic =
        ' \tfemale   cousin　rapid exotic\nribbon level\u3000equip   legal fun river hotel duty trip youth rebel'
      const expected =
        'female cousin rapid exotic ribbon level equip legal fun river hotel duty trip youth rebel'
      expect(normalizeMnemonic(mnemonic)).toEqual(expected)
    })

    it('should normalize whitespace of Japanese mnemonics using ideographic spaces', () => {
      const mnemonic =
        ' せけん　まなぶ　せんえい　ねっしん　はくしゅ　うなずく　いがく　ひこく\nにちようび　いがく　なふだ　ばかり　どんぶり\tせきらんうん きかく　'
      const expected =
        'せけん　まなぶ　せんえい　ねっしん　はくしゅ　うなずく　いがく　ひこく　にちようび　いがく　なふだ　ばかり　どんぶり　せきらんうん　きかく'
      expect(normalizeMnemonic(mnemonic)).toEqual(expected)
    })

    for (const language of getAllLanguages()) {
      it(`should pass through newly generated mnemonics in ${MnemonicLanguages[language]}`, async () => {
        const mnemonic = await generateMnemonic(MnemonicStrength.s256_24words, language)
        expect(normalizeMnemonic(mnemonic)).toEqual(mnemonic)
      })
    }
  })

  describe('.invalidMnemonicWords()', () => {
    it('should return list of invalid words in a phrase with errors', () => {
      const mnemonic =
        'salute roayl possible rare dufbuty wabnt ynfikd oik cabbage labor approbe winner claw conduct spider velvet buyer level second adult payment blish inject draw'
      const invalidWords = ['roayl', 'dufbuty', 'wabnt', 'ynfikd', 'oik', 'approbe', 'blish']
      expect(invalidMnemonicWords(mnemonic)).toEqual(invalidWords)
    })

    it('should return an empty list when given a correct phrase', () => {
      const mnemonic =
        'salute royal possible rare dignity want unfold oil cabbage labor approve winner claw conduct spider velvet buyer level second adult payment blush inject draw'
      expect(invalidMnemonicWords(mnemonic)).toEqual([])
    })

    it('should return undefined when the language is undetermined', () => {
      // A specially crafted phrase with equal numbers of english and spanish words, one of each being invalid.
      const mnemonic =
        'oil sponsor unlock diet aprove trim usual ethics tip prepare twist hunt neto sanidad tregua cuneta cazar tirón trueno enredo tauro pan torpedo húmedo'
      expect(invalidMnemonicWords(mnemonic)).not.toBeDefined()
    })
  })

  describe('.suggestMnemonicCorrections()', () => {
    it('should correct a single simple typo on the first suggestion', () => {
      const cases = [
        {
          mnemonic: 'crush hollow differ mean easy ostrihc almost cherry route hurt inner bless',
          corrected: 'crush hollow differ mean easy ostrich almost cherry route hurt inner bless',
        },
        {
          mnemonic: 'monster note endless discover tilt glide girl wing spstial imitate mad ridge',
          corrected: 'monster note endless discover tilt glide girl wing spatial imitate mad ridge',
        },
        {
          mnemonic: 'mimo musgo efecto danza tariot gente gavilán visor sala imán madre potencia',
          corrected: 'mimo musgo efecto danza tarot gente gavilán visor sala imán madre potencia',
        },
        {
          mnemonic:
            'linéaire marron dosage déborder spiral farine faibvlir virtuose risible géomètre ivresse pinceau',
          corrected:
            'linéaire marron dosage déborder spiral farine faiblir virtuose risible géomètre ivresse pinceau',
        },
        {
          mnemonic:
            'leme malandro depurar coperoi sovado extrato explanar vilarejo resolver garrafa inverno pergunta',
          corrected:
            'leme malandro depurar copeiro sovado extrato explanar vilarejo resolver garrafa inverno pergunta',
        },
      ]

      for (const { mnemonic, corrected } of cases) {
        expect(suggestMnemonicCorrections(mnemonic).next().value).toEqual(corrected)
      }
    })

    it('should quickly offer the corect suggestion for a phrase with a few typos', () => {
      // First 5 phrases were quickly copied on a keyboard to produce typos.
      const cases = [
        {
          mnemonic:
            'whear poitdoor cup shoulder diret broccoli fragile donate legend slogan crew between secrety recall asset',
          corrected:
            'wheat outdoor cup shoulder dirt broccoli fragile donate legend slogan crew between secret recall asset',
        },
        {
          mnemonic:
            'inner lottery artist cintage climb corn theroty cronze tot segement squirrel south ordinatu assume congress',
          corrected:
            'inner lottery artist vintage climb corn theory bronze toy segment squirrel south ordinary assume congress',
        },
        {
          mnemonic:
            'note evidence bubble dog style master region prosper input amazing moviuew adain awrite drisagree glasre',
          corrected:
            'note evidence bubble dog style master region prosper input amazing movie again write disagree glare',
        },
        {
          // Note: "rent" (typo) and "tent" are both in the BIP-39 English word list.
          mnemonic:
            'cruise arom apology bracket demimnar another vorrow csninn finish walnut rural rent pledge fasgion alarm',
          corrected:
            'cruise atom apology bracket seminar another borrow cabin finish walnut rural tent pledge fashion alarm',
        },
        {
          mnemonic:
            'wisgh animal bracket stand enroll purchase wave quantuim film polar rare fury time great time',
          corrected:
            'wish animal bracket stand enroll purchase wave quantum film polar rare fury time great time',
        },
        {
          mnemonic:
            'debat connect bid lend opkay decreaser library balcony claw become squeeze usage reseccue jazzz segment dinosaur cushion sing markvle iundo depth bag object trash',
          corrected:
            'debate connect bid lend okay decrease library balcony claw become squeeze usage rescue jazz segment dinosaur cushion sing marble undo depth bag object trash',
        },
        {
          mnemonic:
            'salute roayl possible rare dufbuty wabnt ynfikd oik cabbage labor approbe winner claw conduct spider velvet buyer level second adult payment blish inject draw',
          corrected:
            'salute royal possible rare dignity want unfold oil cabbage labor approve winner claw conduct spider velvet buyer level second adult payment blush inject draw',
        },
        {
          mnemonic:
            'frame mmarkety oak dissmiss bried theme avocade wgaon rabbit latin angry kind pitch wild trune chornic lamp cault into prioisty gues review parent add',
          corrected:
            'frame market oak dismiss brief theme avocado wagon rabbit latin angry kind pitch wild tube chronic lamp vault into priority guess review parent add',
        },
      ]

      for (const { mnemonic, corrected } of cases) {
        let attempts = 0
        for (const suggestion of suggestMnemonicCorrections(mnemonic)) {
          attempts++
          if (suggestion === corrected) {
            // Enable the following log statement to see how many attempts each phrase takes.
            // console.log(`Phrase '${mnemonic}' corrected in ${attempts} attempt(s)`)
            break
          }
          if (attempts >= 25) {
            throw new Error(`Phrase '${mnemonic}' was not corrected within 100 attempts`)
          }
        }
      }
    })

    it('should never return an invalid mnemonic', () => {
      const mnemonic =
        'frame mmarkety oak dissmiss bried theme avocade wgaon rabbit latin angry kind pitch wild trune'
      let trials = 0
      for (const suggestion of suggestMnemonicCorrections(mnemonic)) {
        trials++
        expect(validateMnemonic(suggestion)).toBe(true)
        if (trials >= 100) {
          break
        }
      }
    })

    it('should never return the same suggestion twice', () => {
      const mnemonic =
        'frame mmarkety oak dissmiss bried theme avocade wgaon rabbit latin angry kind pitch wild trune'
      const seen = new Set<string>()
      for (const suggestion of suggestMnemonicCorrections(mnemonic)) {
        expect(seen.has(suggestion)).toBe(false)
        seen.add(suggestion)
        if (seen.size >= 100) {
          break
        }
      }
    })
  })
})
