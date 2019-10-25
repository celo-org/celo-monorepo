const RLP = require('rlp')
const Validators = artifacts.require('Validators')

const EXPECTED_BLOCK_TIME = 5 // seconds
const EPOCH_SIZE = 720 // blocks

// Inclusive range iterator.
function* range(start, stop) {
  for (let i = start; i <= stop; i++) {
    yield i
  }
}

// Cycle generates the elements of the given iterable in a continous cycle.
function* cycle(iterable) {
  while (true) {
    yield* iterable
  }
}

module.exports = async function() {
  // https://github.com/celo-org/celo-blockchain/blob/master/consensus/istanbul/utils.go#L79
  function getEpochNumber(block) {
    if (block.number == 0) {
      return 0
    }
    return Math.floor(block.number / EPOCH_SIZE) + 1
  }

  function firstBlockNumberInEpoch(epochNumber) {
    if (epochNumber === 0) {
      throw new Error('no first block for epoch 0')
    }
    return (epochNumber - 1) * EPOCH_SIZE + 1
  }

  function lastBlockNumberInEpoch(epochNumber) {
    if (epochNumber === 0) {
      return 0
    }
    return firstBlockNumberInEpoch(epochNumber) + EPOCH_SIZE - 1
  }

  async function blockTime(block) {
    return block.timestamp - (await web3.eth.getBlock(block.number - 1)).timestamp
  }

  // Extract Istanbul information from the block header.
  // Based on https://github.com/celo-org/celo-blockchain/blob/master/core/types/istanbul.go
  function istanbulHeader(block) {
    return RLP.decode(Buffer.from(block.extraData.slice(2), 'hex').slice(32))
  }

  // Array of validators added in the given block.
  function addedValidators(block) {
    return istanbulHeader(block)[0]
      .map((b) => '0x' + b.toString('hex'))
      .map(web3.utils.toChecksumAddress)
  }

  // Array of validator indices that are removed in the given block.
  function removedValidators(block) {
    let buf = istanbulHeader(block)[2]
    let indices = []
    for (let i = 0; i < buf.length; i++) {
      for (let j = 0; j < 8; j++) {
        if ((buf[buf.length - i - 1] >> j) & 1) {
          indices.push(i * 8 + j)
        }
      }
    }
    return indices
  }

  // Apply adds and removes that are in a block header to the validator set.
  // https://github.com/celo-org/celo-blockchain/blob/master/consensus/istanbul/backend/snapshot.go#L94
  // https://github.com/celo-org/celo-blockchain/blob/master/consensus/istanbul/validator/default.go#L204
  function applyValidatorDiff(validators, added, removed) {
    if (removed.length > validators.length) {
      throw Error(
        `more validators removed ${removed.length} than currently exist ${validators.length}`
      )
    }
    for (let idx of removed) {
      validators[idx] = null
    }

    let iter = added.values()
    for (let i of validators.keys()) {
      if (!validators[i]) {
        let next = iter.next()
        validators[i] = next.value
        if (next.done) {
          break
        }
      }
    }
    validators.push(...iter)
    return validators
  }

  // Replay the block headers to produce the validator set at the given epoch.
  async function validatorsDuring(epochNumber) {
    validators = []
    for (let block of [...range(0, epochNumber - 1)]
      .map(lastBlockNumberInEpoch)
      .map(web3.eth.getBlock)) {
      applyValidatorDiff(validators, addedValidators(await block), removedValidators(await block))
    }
    return validators.filter((v) => !!v)
  }

  async function getEpoch(en) {
    return {
      number: en,
      blocks: await Promise.all(
        [...range(firstBlockNumberInEpoch(en), lastBlockNumberInEpoch(en))].map(web3.eth.getBlock)
      ),
      validators: await validatorsDuring(en),
    }
  }

  /* Main: Look through the last 100 epochs for negligent validators. ========================= */

  let latestEpochNumber = getEpochNumber(await web3.eth.getBlock('latest'))
  for (let i = 1; i <= 100; i++) {
    let epoch = await getEpoch(latestEpochNumber - i)
    console.log(
      `\nLooking at epoch ${epoch.number} which has ${epoch.validators.length} validators.`
    )

    blockTimes = new Map(
      await Promise.all(epoch.blocks.map(async (block) => [block.number, await blockTime(block)]))
    )

    let obversedValidators = new Set()
    for (let block of epoch.blocks) {
      obversedValidators.add(block.miner)
    }

    let missingValidators = epoch.validators.filter((v) => !obversedValidators.has(v))
    console.log(
      `${missingValidators.length} validator(s) did not mine any blocks: ${missingValidators}`
    )

    let proposers = cycle(epoch.validators)
    for (block of epoch.blocks) {
      let time = blockTimes.get(block.number)
      if (time > EXPECTED_BLOCK_TIME) {
        console.log(`\tblock ${block.number} produced ${time - EXPECTED_BLOCK_TIME} seconds late`)
      }

      let skipped = []
      let proposer = null
      while ((proposer = proposers.next().value) !== block.miner) {
        skipped.push(proposer)
      }
      // Intended proposer for the first block of the epoch is unknown.
      if (block === epoch.blocks[0]) {
        continue
      }
      if (skipped.length) {
        console.log(
          `${skipped.length} proposer(s) were skipped at block ${block.number}: [${skipped}]`
        )
      }
    }
  }
}
