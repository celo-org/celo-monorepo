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
      return list[Math.floor(BigNumber.random().times(list.length).toNumber())]
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
