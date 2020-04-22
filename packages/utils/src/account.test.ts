import {
  generateKeys,
  generateKeysSync,
  generateMnemonic,
  MnemonicStrength,
  validateMnemonic,
} from './account'

describe('Mnemonic validation', () => {
  it('should generate 24 word mnemonic', async () => {
    const mnemonic: string = await generateMnemonic()
    expect(mnemonic.split(' ').length).toEqual(24)
  })

  it('should generate 12 word mnemonic', async () => {
    const mnemonic: string = await generateMnemonic(MnemonicStrength.s128_12words)
    expect(mnemonic.split(' ').length).toEqual(12)
  })

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
      {
        derivation0: {
          privateKey: '9b20170cd294190efb2eb1d406a51e6705461cb540e777784565c1d8342016d7',
          publicKey: '0257780786b4ba7bf47b3be6082f65069f552012735a17c2080648de67cfb440c1',
        },
        derivation1: {
          privateKey: '29c025cda952cb59d8504cca390bcdbc2cc3706ca5bfb65a5b6f5dd5dc5176dd',
          publicKey: '029c90f394bea3d46c46896b0bd1b36119b031a6da498b49a32aad77f10ce1f672',
        },
        password: {
          privateKey: '92956ef74d530224029380385ca556240be042b7e5592ffece5945286f1562c3',
          publicKey: '0331003f16d42ea996da1bc91188ff170ea451570a9bed4779682dd27da1892303',
        },
      },
      {
        derivation0: {
          privateKey: 'eb0fea0b0aab13e4115939e2af62a5f136cdeefa1f0480c5550b93550339857d',
          publicKey: '0279548f9e2b8fbbeb91865068257de240fa307d479c94926a32e33f8707c70497',
        },
        derivation1: {
          privateKey: 'cd2aa97d2bf6ddac4f00513eb08de8d40dcff4106508d18ea995ffbff8166420',
          publicKey: '03e4784248f6c4b3bacf8090f67d002e58f4da448bb9b993432fe226abdcd5c83f',
        },
        password: {
          privateKey: '62c928058f72e5a04abcf5e46035d5f0933f996285ec25b3bc9d2b9fc907dc56',
          publicKey: '0240d5adc5c0ce46f3488401e3ea78a261de1cd8a8e6a1d9e55386c6c4881b70ec',
        },
      },
      {
        derivation0: {
          privateKey: 'bfc514b7a895cade755f65196b4807a0635381ee16195b33e22b919ecaedf553',
          publicKey: '034ca1fb554b952b6794da020c8d101527a2a91884dbab671211ce77b2ec3f1a3e',
        },
        derivation1: {
          privateKey: '074e6edfc31f8ccfd93427d204da5ada15124a25fde119b7f65b54ff283b6207',
          publicKey: '03606b5f63932b2a896c3fb3aa7f60f0f5aa9cd7ce8310199cae2c06514159f799',
        },
        password: {
          privateKey: '743594169177ae8ab3dd08a6e22842a2ac43dbe886a73eebc33cd21e73175661',
          publicKey: '03aa657da15ceb192b73a3aa3a36512a765d9c9751763dd7801585fba8d10f7467',
        },
      },
      {
        derivation0: {
          privateKey: 'ad9d478f3a855736747d2df3a11b36b7226803909b60b21c9d48a92d4e918c11',
          publicKey: '0250793d6fb063135eebc743b4249871404caf1d36be47174fad9c41454e50bf19',
        },
        derivation1: {
          privateKey: '184d459a9cb02c880f9bdfafaae659a0dddf66579c48b8d233ae87a07495568e',
          publicKey: '031ee923acb25f4acd8ce80f7b81c2e2aad7fc62e388049bebad6ea8d87e6660af',
        },
        password: {
          privateKey: '772dc61134b4175847418583f9fe3999b20e47cc47b776bd53d5308580be358e',
          publicKey: '03971d6635334160fb6326d74df505d76a382fcfa90ca510fead1212641d94c9d6',
        },
      },
      {
        derivation0: {
          privateKey: '24ed2734c061841c2c539e3d1996e12af4f0ffbd4863a781a8161a404ed8c0a2',
          publicKey: '032aa02cd49f35d2f719907533c65e4fcbbfd4ce9ca2b0010096dc9c5855d622cf',
        },
        derivation1: {
          privateKey: '4b17b59a0fec80e206bb49d72c9a4440ab02a755b3857c18cb069ceb4d96c629',
          publicKey: '02849907f8c3e80fc32708fecf08d5784e55bf284d6e2e2dd7682f02a04575a469',
        },
        password: {
          privateKey: '302f4b9a1b413e9628319e65d7e81d082f3e614662e291ea985a270243851764',
          publicKey: '03ad0cd6e8106e90004d9758699d478a2620f3b3b629d6ef5748aa63172a9d1917',
        },
      },
      {
        derivation0: {
          privateKey: '4ae237a3fcfcbd877f11cdbf25ea3db398e67c261ddf6448427076da87759b99',
          publicKey: '03a8c7f50e68fc1c304814ad55837802f0b95b29263cda3d19e86bc26f9eaa5bed',
        },
        derivation1: {
          privateKey: '717dd0b70395964bc4175492f61599e7165cfbc6290fa76798fd77f8dfd9bbb9',
          publicKey: '0361d8adcac067bb2927d625e642af5f1f53914b102d0740ad97d103ea079a6ce4',
        },
        password: {
          privateKey: '89e60bc0273bc04a3f485e1d04d27daeceb0239976176121163c3a94bf3cc150',
          publicKey: '02e2bdc55d48f3aba547f9da95a30fc3ba54aebb1e80a1ef812679eeba7b84e269',
        },
      },
      {
        derivation0: {
          privateKey: '6f2018327ce361c5d364887c62a16edbafafd6e3ce7f6130ddea4d2cc07d1eb2',
          publicKey: '032cedaff844f7bbd9b85b08b562f04c03f0a047f90752a92392324e0ebd9387dd',
        },
        derivation1: {
          privateKey: '512697d6d78e982146291a6ed3f1cb1deae5b2d4005844d80c9275387e83282d',
          publicKey: '03f6edaeea73b5b1b458b9f0976886ef4a07da0fbf59820ab2955358484f52cb8c',
        },
        password: {
          privateKey: 'c03623b1dc87f84df88bcdc7545bb9c6d301249155d460340ad7ed39745f0f40',
          publicKey: '028a04e5a60c7373c381c68398246dadecec2651098ab87f9cf450eddb9927b927',
        },
      },
      {
        derivation0: {
          privateKey: '6ae10ba98308b7798884011ebbb188184bc0c2904399a5e7ec3105160ac9ef92',
          publicKey: '031f148d9eab8fe8395c68e38fa9b37973f33062d9753fe7167964d1a71085428f',
        },
        derivation1: {
          privateKey: '29c268172bef9cb4149dec17c920cd6bd3c1a5bcbbed30a032d456a5ddaac8db',
          publicKey: '03e07cf7f48b67084796f0c159a8755cbf6ead1bc1e3d666f9a5b2f56c9435bdbd',
        },
        password: {
          privateKey: 'f88b1b445e91a5b9437be9b8f92ef5e641458fbfb59d33437ef08d9db43b110d',
          publicKey: '0390139841611a0b10356f90d3cc537c25990a66a062b36c509e816a2c66d50931',
        },
      },
      {
        derivation0: {
          privateKey: '9eb5e2563db62f8b715e8d7277ef53fdf745647a74d75c77507742a4c732a4ba',
          publicKey: '03897442a9cf0f0d965209b3eaef080fd0fbd4a7f30e1b2853855b32f93e93882f',
        },
        derivation1: {
          privateKey: '4b0daa34bb4dbf682b611bd81e656eede86b2f4ec9300e8b12257eddd57f3782',
          publicKey: '025de8c4257d420ec7f17412b6cff7a5fc453e6347c497baa8753400d26af7a3dd',
        },
        password: {
          privateKey: '7b85c57c5ef6377821d71efc94c5421232a710bd8c77c3d74cffd4af9dd7a7a8',
          publicKey: '028e196d287b368c27ba3707fce0a7f7f93c39a09397fb1e78dfd31a282e53b0e3',
        },
      },
      {
        derivation0: {
          privateKey: '5fb7e96fd9b85c36468c1f7e4d856780043d5a73744325c32d5b5b5efba10788',
          publicKey: '038a76bed78b335ae75322bc6c2b71abd6ebc4e1275ae0d3c2864a13f12073f661',
        },
        derivation1: {
          privateKey: 'eb84d29cf34bddd3151c3b2635dd9d1738716f98d0aa4814360344978e3c8f7c',
          publicKey: '03d7229e58c2c2d5ad147b2e04d45d9f90175d19be7086e6168739916b63335c7b',
        },
        password: {
          privateKey: '76a0c07acd00d4792b4890346dbe08ee68237df2a4df65226f66594342f2b944',
          publicKey: '0214ebc223fcd2e1e8312738c4a625789e665def68b7a9696d9b987e2b38a8c71d',
        },
      },
    ]
    expect(mnemonics.length).toEqual(expectedPrivateKeys.length)
    for (let i = 0; i < mnemonics.length; ++i) {
      expect(validateMnemonic(mnemonics[i])).toBeTruthy()
      const derivation0 = generateKeysSync(mnemonics[i])
      const derivation1 = generateKeysSync(mnemonics[i], undefined, 1)
      const password = generateKeysSync(mnemonics[i], 'password')
      expect({ derivation0, derivation1, password }).toEqual(expectedPrivateKeys[i])
    }
  })

  it('should generate async an expected private key for a mnemonic', async () => {
    const expectedPrivateKey = {
      derivation0: {
        privateKey: '9b20170cd294190efb2eb1d406a51e6705461cb540e777784565c1d8342016d7',
        publicKey: '0257780786b4ba7bf47b3be6082f65069f552012735a17c2080648de67cfb440c1',
      },
      derivation1: {
        privateKey: '29c025cda952cb59d8504cca390bcdbc2cc3706ca5bfb65a5b6f5dd5dc5176dd',
        publicKey: '029c90f394bea3d46c46896b0bd1b36119b031a6da498b49a32aad77f10ce1f672',
      },
      password: {
        privateKey: '92956ef74d530224029380385ca556240be042b7e5592ffece5945286f1562c3',
        publicKey: '0331003f16d42ea996da1bc91188ff170ea451570a9bed4779682dd27da1892303',
      },
    }
    const mnemonic =
      'language quiz proud sample canoe trend topic upper coil rack choice engage noodle panda mutual grab shallow thrive forget trophy pull pool mask height'

    const derivation0 = await generateKeys(mnemonic)
    const derivation1 = await generateKeys(mnemonic, undefined, 1)
    const password = await generateKeys(mnemonic, 'password')
    expect({ derivation0, derivation1, password }).toEqual(expectedPrivateKey)
  })
})
