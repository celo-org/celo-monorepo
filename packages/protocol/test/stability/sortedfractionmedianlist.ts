import { assertRevert, assertSameAddress, NULL_ADDRESS } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import { SortedFractionMedianListTestContract, SortedFractionMedianListTestInstance } from 'types'

const SortedFractionMedianListTest: SortedFractionMedianListTestContract = artifacts.require(
  'SortedFractionMedianListTest'
)

// @ts-ignore
// TODO(mcortesi): Use BN
SortedFractionMedianListTest.numberFormat = 'BigNumber'

// TODO(asa): Test tail stuff
contract('SortedFractionMedianListTest', (accounts: string[]) => {
  let sortedFractionMedianListTest: SortedFractionMedianListTestInstance

  beforeEach(async () => {
    sortedFractionMedianListTest = await SortedFractionMedianListTest.new()
  })

  describe('#insert()', () => {
    const key = accounts[9]
    const numerator = 2
    const denominator = 1
    it('should add a single element to the list', async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.isTrue(await sortedFractionMedianListTest.contains(key))
      const [keys, numerators, denominators] = await sortedFractionMedianListTest.getElements()
      assert.equal(keys.length, 1)
      assert.equal(numerators.length, 1)
      assert.equal(denominators.length, 1)
      assert.equal(keys[0], key)
      assert.equal(numerators[0].toNumber(), numerator)
      assert.equal(denominators[0].toNumber(), denominator)
    })

    it('should increment numElements', async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.equal((await sortedFractionMedianListTest.getNumElements()).toNumber(), 1)
    })

    it('should update the head', async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.equal(await sortedFractionMedianListTest.head(), key)
    })

    it('should update the tail', async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.equal(await sortedFractionMedianListTest.tail(), key)
    })

    it('should update the median', async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.equal(await sortedFractionMedianListTest.medianKey(), key)
    })

    it('should revert if key is 0', async () => {
      await assertRevert(
        sortedFractionMedianListTest.insert(
          NULL_ADDRESS,
          numerator,
          denominator,
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      )
    })

    it('should revert if lesser is equal to key', async () => {
      await assertRevert(
        sortedFractionMedianListTest.insert(key, numerator, denominator, key, NULL_ADDRESS)
      )
    })

    it('should revert if greater is equal to key', async () => {
      await assertRevert(
        sortedFractionMedianListTest.insert(key, numerator, denominator, NULL_ADDRESS, key)
      )
    })

    describe('when an element is already in the list', () => {
      beforeEach(async () => {
        await sortedFractionMedianListTest.insert(
          key,
          numerator,
          denominator,
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      })

      it('should revert when inserting an element already in the list', async () => {
        await assertRevert(
          sortedFractionMedianListTest.insert(
            key,
            numerator,
            denominator,
            NULL_ADDRESS,
            NULL_ADDRESS
          )
        )
      })
    })
  })

  describe('#update()', () => {
    const key = accounts[9]
    const numerator = 2
    const denominator = 1
    const newNumerator = 3
    const newDenominator = 3
    beforeEach(async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
    })

    it('should update the value for an existing element', async () => {
      await sortedFractionMedianListTest.update(
        key,
        newNumerator,
        newDenominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.isTrue(await sortedFractionMedianListTest.contains(key))
      const [keys, numerators, denominators] = await sortedFractionMedianListTest.getElements()
      assert.equal(keys.length, 1)
      assert.equal(numerators.length, 1)
      assert.equal(denominators.length, 1)
      assert.equal(keys[0], key)
      assert.equal(numerators[0].toNumber(), newNumerator)
      assert.equal(denominators[0].toNumber(), newDenominator)
    })

    it('should revert if the key is not in the list', async () => {
      await assertRevert(
        sortedFractionMedianListTest.update(
          accounts[8],
          newNumerator,
          newDenominator,
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      )
    })

    it('should revert if lesser is equal to key', async () => {
      await assertRevert(
        sortedFractionMedianListTest.update(key, newNumerator, newDenominator, key, NULL_ADDRESS)
      )
    })

    it('should revert if greater is equal to key', async () => {
      await assertRevert(
        sortedFractionMedianListTest.update(key, newNumerator, newDenominator, NULL_ADDRESS, key)
      )
    })
  })

  describe('#remove()', () => {
    const key = accounts[9]
    const numerator = 2
    const denominator = 1
    beforeEach(async () => {
      await sortedFractionMedianListTest.insert(
        key,
        numerator,
        denominator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
    })

    it('should remove the element from the list', async () => {
      await sortedFractionMedianListTest.remove(key)
      assert.isFalse(await sortedFractionMedianListTest.contains(key))
    })

    it('should decrement numElements', async () => {
      await sortedFractionMedianListTest.remove(key)
      assert.equal((await sortedFractionMedianListTest.getNumElements()).toNumber(), 0)
    })

    it('should update the head', async () => {
      await sortedFractionMedianListTest.remove(key)
      assert.equal(await sortedFractionMedianListTest.head(), NULL_ADDRESS)
    })

    it('should update the tail', async () => {
      await sortedFractionMedianListTest.remove(key)
      assert.equal(await sortedFractionMedianListTest.tail(), NULL_ADDRESS)
    })

    it('should update the median', async () => {
      await sortedFractionMedianListTest.remove(key)
      assert.equal(await sortedFractionMedianListTest.medianKey(), NULL_ADDRESS)
    })

    it('should revert if the key is not in the list', async () => {
      await assertRevert(sortedFractionMedianListTest.remove(accounts[8]))
    })
  })

  describe('when there are multiple inserts, updates, and removals', () => {
    interface SortedElement {
      key: string
      numerator: BigNumber
      denominator: BigNumber
    }

    enum SortedListActionType {
      Update = 1,
      Remove,
      Insert,
    }

    interface SortedListAction {
      actionType: SortedListActionType
      element: SortedElement
    }

    const randomElement = <A>(list: A[]): A => {
      return list[
        Math.floor(
          BigNumber.random()
            .times(list.length)
            .toNumber()
        )
      ]
    }

    const makeActionSequence = (length: number, numKeys: number): SortedListAction[] => {
      const sequence: SortedListAction[] = []
      const listKeys: Set<string> = new Set([])
      // @ts-ignore
      const keyOptions = Array.from({ length: numKeys }, () =>
        web3.utils.randomHex(20).toLowerCase()
      )
      for (let i = 0; i < length; i++) {
        const key = randomElement(keyOptions)
        let action: SortedListActionType
        if (listKeys.has(key)) {
          action = randomElement([SortedListActionType.Update, SortedListActionType.Remove])
          if (action === SortedListActionType.Remove) {
            listKeys.delete(key)
          }
        } else {
          action = SortedListActionType.Insert
          listKeys.add(key)
        }
        sequence.push({
          actionType: action,
          element: {
            key,
            numerator: BigNumber.random(20).shiftedBy(20),
            denominator: BigNumber.random(20).shiftedBy(20),
          },
        })
      }
      return sequence
    }

    const parseElements = (
      keys: string[],
      numerators: BigNumber[],
      denominators: BigNumber[]
    ): SortedElement[] =>
      keys.map((key, i) => ({
        key: key.toLowerCase(),
        numerator: numerators[i],
        denominator: denominators[i],
      }))

    const assertSorted = (elements: SortedElement[]) => {
      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          assert.isTrue(
            elements[i].numerator
              .div(elements[i].denominator)
              .lte(elements[i - 1].numerator.div(elements[i - 1].denominator)),
            'Elements not sorted'
          )
        }
      }
    }

    const assertRelations = (
      elements: SortedElement[],
      relations: BigNumber[],
      medianIndex: number
    ) => {
      const MedianRelationEnum = {
        Undefined: 0,
        Lesser: 1,
        Greater: 2,
        Equal: 3,
      }
      for (let i = 0; i < elements.length; i++) {
        if (i < medianIndex) {
          assert.equal(relations[i].toNumber(), MedianRelationEnum.Greater)
        } else if (i === medianIndex) {
          assert.equal(relations[i].toNumber(), MedianRelationEnum.Equal)
        } else {
          assert.equal(relations[i].toNumber(), MedianRelationEnum.Lesser)
        }
      }
    }

    const assertSortedFractionListInvariants = async (
      elementsPromise: Promise<[string[], BigNumber[], BigNumber[], BigNumber[]]>,
      numElementsPromise: Promise<BigNumber>,
      medianPromise: Promise<string>,
      expectedKeys: Set<string>
    ) => {
      const [keys, numerators, denominators, relations] = await elementsPromise
      const elements = parseElements(keys, numerators, denominators)
      assert.equal(
        (await numElementsPromise).toNumber(),
        expectedKeys.size,
        'Incorrect number of elements'
      )

      assert.deepEqual(
        elements.map((x) => x.key).sort(),
        Array.from(expectedKeys.values()).sort(),
        'keys do not match'
      )

      assertSorted(elements)
      let expectedMedianKey = NULL_ADDRESS
      let medianIndex = 0
      if (elements.length > 0) {
        medianIndex = Math.floor((elements.length - 1) / 2)
        expectedMedianKey = elements[medianIndex].key
      }
      assertSameAddress(await medianPromise, expectedMedianKey, 'Incorrect median element')
      assertRelations(elements, relations, medianIndex)
    }

    const doActionsAndAssertInvariants = async (
      numActions: number,
      numKeys: number,
      getLesserAndGreater: (element: SortedElement) => Promise<{ lesser: string; greater: string }>,
      allowFailingTx: boolean = false
    ) => {
      const sequence = makeActionSequence(numActions, numKeys)
      const listKeys: Set<string> = new Set([])
      let successes = 0
      for (let i = 0; i < numActions; i++) {
        const action = sequence[i]
        try {
          if (action.actionType === SortedListActionType.Remove) {
            await sortedFractionMedianListTest.remove(action.element.key)
            listKeys.delete(action.element.key)
          } else {
            const { lesser, greater } = await getLesserAndGreater(action.element)
            if (action.actionType === SortedListActionType.Insert) {
              await sortedFractionMedianListTest.insert(
                action.element.key,
                action.element.numerator,
                action.element.denominator,
                lesser,
                greater
              )
              listKeys.add(action.element.key)
            } else if (action.actionType === SortedListActionType.Update) {
              await sortedFractionMedianListTest.update(
                action.element.key,
                action.element.numerator,
                action.element.denominator,
                lesser,
                greater
              )
            }
          }
          successes += 1
        } catch (e) {
          if (!allowFailingTx) {
            throw new Error(e)
          }
        }
        await assertSortedFractionListInvariants(
          sortedFractionMedianListTest.getElements(),
          sortedFractionMedianListTest.getNumElements(),
          sortedFractionMedianListTest.medianKey(),
          listKeys
        )
      }
      if (allowFailingTx) {
        const expectedSuccessRate = 2.0 / numKeys
        assert.isAtLeast(successes / numActions, expectedSuccessRate * 0.75)
      }
    }

    it('should maintain invariants when lesser, greater are correct', async () => {
      const numActions = 100
      const numKeys = 20
      const getLesserAndGreater = async (element: SortedElement) => {
        const [keys, numerators, denominators] = await sortedFractionMedianListTest.getElements()
        const elements = parseElements(keys, numerators, denominators)
        let lesser = NULL_ADDRESS
        let greater = NULL_ADDRESS
        const value = element.numerator.div(element.denominator)
        // Iterate from each end of the list towards the other end, saving the key with the
        // smallest value >= `value` and the key with the largest value <= `value`.
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].key !== element.key.toLowerCase()) {
            if (elements[i].numerator.div(elements[i].denominator).gte(value)) {
              greater = elements[i].key
            }
          }
          const j = elements.length - i - 1

          if (elements[j].key !== element.key.toLowerCase()) {
            if (elements[j].numerator.div(elements[j].denominator).lte(value)) {
              lesser = elements[j].key
            }
          }
        }
        return { lesser, greater }
      }
      await doActionsAndAssertInvariants(numActions, numKeys, getLesserAndGreater)
    })

    it('should maintain invariants when lesser, greater are incorrect', async () => {
      const numReports = 200
      const numKeys = 20
      const getRandomKeys = async () => {
        let lesser = NULL_ADDRESS
        let greater = NULL_ADDRESS
        const [keys, , ,] = await sortedFractionMedianListTest.getElements()
        if (keys.length > 0) {
          lesser = randomElement(keys)
          greater = randomElement(keys)
        }
        return { lesser, greater }
      }
      await doActionsAndAssertInvariants(numReports, numKeys, getRandomKeys, true)
    })
  })
})
