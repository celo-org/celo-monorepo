import { NULL_ADDRESS } from '@celo/base/lib/address'
import { assertRevert, assertSameAddress } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import {
  AddressSortedLinkedListWithMedianTestContract,
  AddressSortedLinkedListWithMedianTestInstance,
} from 'types'

const AddressSortedLinkedListWithMedianTest: AddressSortedLinkedListWithMedianTestContract =
  artifacts.require('AddressSortedLinkedListWithMedianTest')

// @ts-ignore
// TODO(mcortesi): Use BN
AddressSortedLinkedListWithMedianTest.numberFormat = 'BigNumber'

// TODO(asa): Test tail stuff
contract('AddressSortedLinkedListWithMedianTest', (accounts: string[]) => {
  let addressSortedLinkedListWithMedianTest: AddressSortedLinkedListWithMedianTestInstance

  beforeEach(async () => {
    addressSortedLinkedListWithMedianTest = await AddressSortedLinkedListWithMedianTest.new()
  })

  describe('#insert()', () => {
    const key = accounts[9]
    const numerator = 2
    it('should add a single element to the list', async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
      assert.isTrue(await addressSortedLinkedListWithMedianTest.contains(key))
      const [keys, numerators] = await addressSortedLinkedListWithMedianTest.getElements()
      assert.equal(keys.length, 1)
      assert.equal(numerators.length, 1)
      assert.equal(keys[0], key)
      assert.equal(numerators[0].toNumber(), numerator)
    })

    it('should increment numElements', async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
      assert.equal((await addressSortedLinkedListWithMedianTest.getNumElements()).toNumber(), 1)
    })

    it('should update the head', async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
      assert.equal(await addressSortedLinkedListWithMedianTest.head(), key)
    })

    it('should update the tail', async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
      assert.equal(await addressSortedLinkedListWithMedianTest.tail(), key)
    })

    it('should update the median', async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
      assert.equal(await addressSortedLinkedListWithMedianTest.medianKey(), key)
    })

    it('should revert if key is 0', async () => {
      await assertRevert(
        addressSortedLinkedListWithMedianTest.insert(
          NULL_ADDRESS,
          numerator,
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      )
    })

    it('should revert if lesser is equal to key', async () => {
      await assertRevert(
        addressSortedLinkedListWithMedianTest.insert(key, numerator, key, NULL_ADDRESS)
      )
    })

    it('should revert if greater is equal to key', async () => {
      await assertRevert(
        addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, key)
      )
    })

    describe('when an element is already in the list', () => {
      beforeEach(async () => {
        await addressSortedLinkedListWithMedianTest.insert(
          key,
          numerator,
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      })

      it('should revert when inserting an element already in the list', async () => {
        await assertRevert(
          addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
        )
      })
    })
  })

  describe('#update()', () => {
    const key = accounts[9]
    const numerator = 2
    const newNumerator = 3
    beforeEach(async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
    })

    it('should update the value for an existing element', async () => {
      await addressSortedLinkedListWithMedianTest.update(
        key,
        newNumerator,
        NULL_ADDRESS,
        NULL_ADDRESS
      )
      assert.isTrue(await addressSortedLinkedListWithMedianTest.contains(key))
      const [keys, numerators] = await addressSortedLinkedListWithMedianTest.getElements()
      assert.equal(keys.length, 1)
      assert.equal(numerators.length, 1)
      assert.equal(keys[0], key)
      assert.equal(numerators[0].toNumber(), newNumerator)
    })

    it('should revert if the key is not in the list', async () => {
      await assertRevert(
        addressSortedLinkedListWithMedianTest.update(
          accounts[8],
          newNumerator,
          NULL_ADDRESS,
          NULL_ADDRESS
        )
      )
    })

    it('should revert if lesser is equal to key', async () => {
      await assertRevert(
        addressSortedLinkedListWithMedianTest.update(key, newNumerator, key, NULL_ADDRESS)
      )
    })

    it('should revert if greater is equal to key', async () => {
      await assertRevert(
        addressSortedLinkedListWithMedianTest.update(key, newNumerator, NULL_ADDRESS, key)
      )
    })
  })

  describe('#remove()', () => {
    const key = accounts[9]
    const numerator = 2
    beforeEach(async () => {
      await addressSortedLinkedListWithMedianTest.insert(key, numerator, NULL_ADDRESS, NULL_ADDRESS)
    })

    it('should remove the element from the list', async () => {
      await addressSortedLinkedListWithMedianTest.remove(key)
      assert.isFalse(await addressSortedLinkedListWithMedianTest.contains(key))
    })

    it('should decrement numElements', async () => {
      await addressSortedLinkedListWithMedianTest.remove(key)
      assert.equal((await addressSortedLinkedListWithMedianTest.getNumElements()).toNumber(), 0)
    })

    it('should update the head', async () => {
      await addressSortedLinkedListWithMedianTest.remove(key)
      assert.equal(await addressSortedLinkedListWithMedianTest.head(), NULL_ADDRESS)
    })

    it('should update the tail', async () => {
      await addressSortedLinkedListWithMedianTest.remove(key)
      assert.equal(await addressSortedLinkedListWithMedianTest.tail(), NULL_ADDRESS)
    })

    it('should update the median', async () => {
      await addressSortedLinkedListWithMedianTest.remove(key)
      assert.equal(await addressSortedLinkedListWithMedianTest.medianKey(), NULL_ADDRESS)
    })

    it('should revert if the key is not in the list', async () => {
      await assertRevert(addressSortedLinkedListWithMedianTest.remove(accounts[8]))
    })
  })

  describe('when there are multiple inserts, updates, and removals', () => {
    interface SortedElement {
      key: string
      numerator: BigNumber
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
      return list[Math.floor(BigNumber.random().times(list.length).toNumber())]
    }

    const randomElementOrNullAddress = (list: string[]): string => {
      if (BigNumber.random().isLessThan(0.5)) {
        return NULL_ADDRESS
      } else {
        return randomElement(list)
      }
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
          },
        })
      }
      return sequence
    }

    const parseElements = (keys: string[], numerators: BigNumber[]): SortedElement[] =>
      keys.map((key, i) => ({
        key: key.toLowerCase(),
        numerator: numerators[i],
      }))

    const assertSorted = (elements: SortedElement[]) => {
      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          assert.isTrue(elements[i].numerator.lte(elements[i - 1].numerator), 'Elements not sorted')
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
      elementsPromise: Promise<[string[], BigNumber[], BigNumber[]]>,
      numElementsPromise: Promise<BigNumber>,
      medianPromise: Promise<string>,
      expectedKeys: Set<string>
    ) => {
      const [keys, numerators, relations] = await elementsPromise
      const elements = parseElements(keys, numerators)
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
            await addressSortedLinkedListWithMedianTest.remove(action.element.key)
            listKeys.delete(action.element.key)
          } else {
            const { lesser, greater } = await getLesserAndGreater(action.element)
            if (action.actionType === SortedListActionType.Insert) {
              await addressSortedLinkedListWithMedianTest.insert(
                action.element.key,
                action.element.numerator,
                lesser,
                greater
              )
              listKeys.add(action.element.key)
            } else if (action.actionType === SortedListActionType.Update) {
              await addressSortedLinkedListWithMedianTest.update(
                action.element.key,
                action.element.numerator,
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
          addressSortedLinkedListWithMedianTest.getElements(),
          addressSortedLinkedListWithMedianTest.getNumElements(),
          addressSortedLinkedListWithMedianTest.medianKey(),
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
        const [keys, numerators] = await addressSortedLinkedListWithMedianTest.getElements()
        const elements = parseElements(keys, numerators)
        let lesser = NULL_ADDRESS
        let greater = NULL_ADDRESS
        const value = element.numerator
        // Iterate from each end of the list towards the other end, saving the key with the
        // smallest value >= `value` and the key with the largest value <= `value`.
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].key !== element.key.toLowerCase()) {
            if (elements[i].numerator.gte(value)) {
              greater = elements[i].key
            }
          }
          const j = elements.length - i - 1

          if (elements[j].key !== element.key.toLowerCase()) {
            if (elements[j].numerator.lte(value)) {
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
        const [keys, , ,] = await addressSortedLinkedListWithMedianTest.getElements()
        if (keys.length > 0) {
          lesser = randomElementOrNullAddress(keys)
          greater = randomElementOrNullAddress(keys)
        }
        return { lesser, greater }
      }
      await doActionsAndAssertInvariants(numReports, numKeys, getRandomKeys, true)
    })
  })
})
