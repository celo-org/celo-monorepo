abstract class Base {
  test() {
    console.log('base test')

    this.testie()
  }

  testie() {
    console.log('base testie')
  }
}

class Sub extends Base {
  testie() {
    console.log('sub testie')
  }
}

new Sub().test()
