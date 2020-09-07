import { assertRevert } from '@celo/protocol/lib/test-utils'
import BigNumber from 'bignumber.js'
import { IntegerSortedLinkedListTestContract, IntegerSortedLinkedListTestInstance } from 'types'

const IntegerSortedLinkedListTest: IntegerSortedLinkedListTestContract = artifacts.require(
  'IntegerSortedLinkedListTest'
)

// @ts-ignore
// TODO(mcortesi): Use BN.js
IntegerSortedLinkedListTest.numberFormat = 'BigNumber'

// TODO(asaj): Test SoredLinkedList rather than IntegerSortedLinkedList
contract('IntegerSortedLinkedListTest', () => {
  let sortedListTest: IntegerSortedLinkedListTestInstance
  beforeEach(async () => {
    sortedListTest = await IntegerSortedLinkedListTest.new()
  })

  describe('#insert()', () => {
    const key = 1
    const value = 5
    it('should add a single element to the list', async () => {
      await sortedListTest.insert(key, value, 0, 0)
      assert.isTrue(await sortedListTest.contains(key))
      const [keys, values] = await sortedListTest.getElements()
      assert.equal(keys.length, 1)
      assert.equal(values.length, 1)
      assert.equal(keys[0].toNumber(), key)
      assert.equal(values[0].toNumber(), value)
    })

    it('should increment numElements', async () => {
      await sortedListTest.insert(key, value, 0, 0)
      assert.equal((await sortedListTest.getNumElements()).toNumber(), 1)
    })

    it('should update the head', async () => {
      await sortedListTest.insert(key, value, 0, 0)
      assert.equal((await sortedListTest.head()).toNumber(), key)
    })

    it('should update the tail', async () => {
      await sortedListTest.insert(key, value, 0, 0)
      assert.equal((await sortedListTest.tail()).toNumber(), key)
    })

    it('should revert if key is 0', async () => {
      await assertRevert(sortedListTest.insert(0, value, 0, 0))
    })

    it('should revert if lesser is equal to key', async () => {
      await assertRevert(sortedListTest.insert(key, value, key, 0))
    })

    it('should revert if greater is equal to key', async () => {
      await assertRevert(sortedListTest.insert(key, value, 0, key))
    })

    describe('when an element is already in the list', () => {
      beforeEach(async () => {
        await sortedListTest.insert(key, value, 0, 0)
      })

      it('should revert when inserting an element already in the list', async () => {
        await assertRevert(sortedListTest.insert(key, value, 0, key))
      })

      it('should revert when inserting a non-maximal element at the head of the list', async () => {
        const nonKey = key - 1
        const newKey = key + 1
        await assertRevert(sortedListTest.insert(newKey, value - 1, nonKey, 0))
      })
    })
  })

  describe('#update()', () => {
    const key = 1
    const value = 10
    const newValue = 20
    beforeEach(async () => {
      await sortedListTest.insert(key, value, 0, 0)
    })

    it('should update the value for an existing element', async () => {
      await sortedListTest.update(key, newValue, 0, 0)
      assert.isTrue(await sortedListTest.contains(key))
      const [keys, values] = await sortedListTest.getElements()
      assert.equal(keys.length, 1)
      assert.equal(values.length, 1)
      assert.equal(keys[0].toNumber(), key)
      assert.equal(values[0].toNumber(), newValue)
    })

    it('should revert if the key is not in the list', async () => {
      await assertRevert(sortedListTest.update(key + 1, newValue, 0, 0))
    })

    it('should revert if lesser is equal to key', async () => {
      await assertRevert(sortedListTest.update(key, newValue, key, 0))
    })

    it('should revert if greater is equal to key', async () => {
      await assertRevert(sortedListTest.update(key, newValue, 0, key))
    })
  })

  describe('#remove()', () => {
    const key = 1
    const value = 10
    beforeEach(async () => {
      await sortedListTest.insert(key, value, 0, 0)
    })

    it('should remove the element from the list', async () => {
      await sortedListTest.remove(key)
      assert.isFalse(await sortedListTest.contains(key))
      const [keys, values] = await sortedListTest.getElements()
      assert.equal(keys.length, 0)
      assert.equal(values.length, 0)
    })

    it('should decrement numElements', async () => {
      await sortedListTest.remove(key)
      assert.equal((await sortedListTest.getNumElements()).toNumber(), 0)
    })

    it('should update the head', async () => {
      await sortedListTest.remove(key)
      assert.equal((await sortedListTest.head()).toNumber(), 0)
    })

    it('should update the tail', async () => {
      await sortedListTest.remove(key)
      assert.equal((await sortedListTest.tail()).toNumber(), 0)
    })

    it('should revert if the key is not in the list', async () => {
      await assertRevert(sortedListTest.remove(key + 1))
    })
  })

  describe('#popN()', () => {
    const n = 3
    const numElements = 10
    beforeEach(async () => {
      for (let key = 1; key < numElements + 1; key++) {
        const value = key * 10
        await sortedListTest.insert(key, value, key - 1, 0)
      }
    })

    it('should remove the n keys with the largest values', async () => {
      await sortedListTest.popN(n)
      for (let key = 1; key < numElements + 1; key++) {
        if (key <= numElements - n) {
          assert.isTrue(await sortedListTest.contains(key))
        } else {
          assert.isFalse(await sortedListTest.contains(key))
        }
      }
      const [keys, values] = await sortedListTest.getElements()
      assert.equal(keys.length, numElements - n)
      assert.equal(values.length, numElements - n)
    })

    it('should return the n keys with the largest values', async () => {
      const popped = await sortedListTest.popN.call(n)
      const expectedPopped = Array.from(Array(numElements + 1).keys())
        .filter((x) => x > numElements - n)
        .reverse()
      assert.deepEqual(
        popped.map((x) => x.toNumber()),
        expectedPopped
      )
    })

    it('should decrement numElements', async () => {
      await sortedListTest.popN(n)
      assert.equal((await sortedListTest.getNumElements()).toNumber(), numElements - n)
    })

    it('should update the head', async () => {
      await sortedListTest.popN(n)
      assert.equal((await sortedListTest.head()).toNumber(), numElements - n)
    })

    it('should revert if n is greater than the number of elements', async () => {
      await assertRevert(sortedListTest.popN(numElements + 1))
    })
  })

  describe('when there are multiple inserts, updates, and removals', () => {
    interface SortedElement {
      key: BigNumber
      value: BigNumber
    }

    enum SortedLinkedListActionType {
      Update = 1,
      Remove,
      Insert,
    }

    interface SortedLinkedListAction {
      actionType: SortedLinkedListActionType
      element: SortedElement
    }

    const randomElement = (list: any[]) => {
      return list[
        Math.floor(
          BigNumber.random()
            .times(list.length)
            .toNumber()
        )
      ]
    }

    const makeActionSequence = (length: number, numKeys: number): SortedLinkedListAction[] => {
      const sequence = []
      const listKeys = new Set([])
      for (let i = 0; i < length; i++) {
        const keyOptions = Array.from({ length: numKeys }, (_, j) => new BigNumber(j + 1))
        const key = randomElement(keyOptions)
        let action
        if (listKeys.has(key.toNumber())) {
          action = randomElement([
            SortedLinkedListActionType.Update,
            SortedLinkedListActionType.Remove,
          ])
          if (action === SortedLinkedListActionType.Remove) {
            listKeys.delete(key.toNumber())
          }
        } else {
          action = SortedLinkedListActionType.Insert
          listKeys.add(key.toNumber())
        }
        sequence.push({
          actionType: action,
          element: {
            key,
            value: BigNumber.random(20).shiftedBy(20),
          },
        })
      }
      return sequence
    }

    const parseElements = (keys: BigNumber[], values: BigNumber[]): SortedElement[] => {
      const elements = []
      for (let i = 0; i < keys.length; i++) {
        elements.push({
          key: keys[i],
          value: values[i],
        })
      }
      return elements
    }

    const assertSorted = (elements: SortedElement[]) => {
      for (let i = 0; i < elements.length; i++) {
        if (i > 0) {
          assert.isTrue(elements[i].value.lte(elements[i - 1].value), 'Elements not sorted')
        }
      }
    }

    const assertSortedLinkedListInvariants = async (
      elementsPromise: Promise<[BigNumber[], BigNumber[]]>,
      numElementsPromise: Promise<BigNumber>,
      headPromise: Promise<BigNumber>,
      tailPromise: Promise<BigNumber>,
      expectedKeys: Set<number>
    ) => {
      const [keys, values] = await elementsPromise
      const elements = parseElements(keys, values)
      assert.equal(
        (await numElementsPromise).toNumber(),
        expectedKeys.size,
        'Incorrect number of elements'
      )
      assert.equal(elements.length, expectedKeys.size, 'Incorrect number of elements')
      assertSorted(elements)
      if (elements.length > 0) {
        assert.equal((await headPromise).toNumber(), elements[0].key.toNumber())
        assert.equal((await tailPromise).toNumber(), elements[elements.length - 1].key.toNumber())
      } else {
        assert.equal((await headPromise).toNumber(), 0)
        assert.equal((await tailPromise).toNumber(), 0)
      }
    }

    const doActionsAndAssertInvariants = async (
      numActions: number,
      numKeys: number,
      getLesserAndGreater: any,
      allowFailingTx: boolean = false
    ) => {
      const sequence = makeActionSequence(numActions, numKeys)
      const listKeys = new Set([])
      let successes = 0
      for (let i = 0; i < numActions; i++) {
        const action = sequence[i]
        try {
          if (action.actionType === SortedLinkedListActionType.Remove) {
            await sortedListTest.remove(action.element.key)
            listKeys.delete(action.element.key.toNumber())
          } else {
            const { lesser, greater } = await getLesserAndGreater(action.element)
            if (action.actionType === SortedLinkedListActionType.Insert) {
              await sortedListTest.insert(action.element.key, action.element.value, lesser, greater)
              listKeys.add(action.element.key.toNumber())
            } else if (action.actionType === SortedLinkedListActionType.Update) {
              await sortedListTest.update(action.element.key, action.element.value, lesser, greater)
            }
          }
          successes += 1
        } catch (e) {
          if (!allowFailingTx) {
            throw new Error(e)
          }
        }
        await assertSortedLinkedListInvariants(
          sortedListTest.getElements(),
          sortedListTest.getNumElements(),
          sortedListTest.head(),
          sortedListTest.tail(),
          listKeys
        )
      }
      if (allowFailingTx) {
        const expectedSuccessRate = 2.0 / numKeys
        assert.isAtLeast(successes / numActions, expectedSuccessRate * 0.75)
      }
    }

    it('should maintain invariants when lesser and greater are correct', async () => {
      const numActions = 100
      const numKeys = 20
      const getLesserAndGreater = async (element: SortedElement) => {
        const [keys, values] = await sortedListTest.getElements()
        const elements = parseElements(keys, values)
        let lesser = new BigNumber(0)
        let greater = new BigNumber(0)
        for (let i = 0; i < elements.length; i++) {
          if (!elements[i].key.eq(element.key)) {
            if (elements[i].value.gte(element.value)) {
              greater = elements[i].key
            }
          }
          const j = elements.length - i - 1

          if (!elements[j].key.eq(element.key)) {
            if (elements[j].value.lte(element.value)) {
              lesser = elements[j].key
            }
          }
        }
        return { lesser, greater }
      }
      await doActionsAndAssertInvariants(numActions, numKeys, getLesserAndGreater)
    })

    it('should maintain invariants when lesser and greater are incorrect', async () => {
      const numReports = 200
      const numKeys = 10
      const getRandomKeys = async () => {
        const [keys] = await sortedListTest.getElements()

        const getLesserOrGreater = () => {
          const r = BigNumber.random()
          const nonElement = () => {
            let i = 0
            while (keys.includes(new BigNumber(i))) {
              i++
            }
            return new BigNumber(i)
          }
          if (r.isLessThan(0.33)) {
            return randomElement(keys)
          } else if (r.isLessThan(0.66)) {
            return nonElement()
          } else {
            return new BigNumber(0)
          }
        }
        return { lesser: getLesserOrGreater(), greater: getLesserOrGreater() }
      }
      await doActionsAndAssertInvariants(numReports, numKeys, getRandomKeys, true)
    })
  })
})
