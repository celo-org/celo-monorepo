import { insertAtBeginning } from 'src/utils/insertAtBeginning'

const letters = ['a', 'b', 'c', 'd']
describe('utils->insertAtBeginning', () => {
  it('inserts a new element at index 0', () => {
    expect(insertAtBeginning('f', letters)).toEqual(['f', 'a', 'b', 'c', 'd'])
  })

  it('moves existing element to the beginning', () => {
    expect(insertAtBeginning('d', letters)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('does not change input on reinserting first element', () => {
    expect(insertAtBeginning('a', letters)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('works on an empty array', () => {
    expect(insertAtBeginning('a', [])).toEqual(['a'])
  })
})
