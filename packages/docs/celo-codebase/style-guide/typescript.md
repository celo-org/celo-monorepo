# TypeScript Style Guide

### Function parameters

_Vanilla parameters_ are preferred over Object Destructuring.

Example of Vanilla parameters:

```
export const tokenFetchFactory = (
  actionName,
  contractGetter,
  actionCreator,
  tag,
)
```

Example of Object Destructuring:

```
export const tokenFetchFactory = ({
  actionName,
  contractGetter,
  actionCreator,
  tag,
}: TokenFetchFactory)
```

This is for simplicity, with fewer lines and some evidence shows it's [faster](https://codeburst.io/es6s-function-destructuring-assignment-is-not-free-lunch-19caacc18137).

### Function definitions: Arrow functions vs Vanilla functions

In the root scope, _Vanilla functions_ are preferred over Arrow functions.

This is because it's consistent with generator functions, simpler to understand, easier to debug, supports recursion and functions are hoisted, meaning no concern about definition order.

### Class methods: anonymous functions vs native methods

Anonymous functions are the preferred way. As shown in the example:

```
class myClass {
    myMethod = () => {}
}
```

### Exporting variables only for testing

When a variable is exported only for the propose of getting accessed by tests, a low dash should be added before the name.

For example instead of doing this:

```
export myFunction{...}
```

This is the preferred way:

```
const myFunction{...}
export _myFunction = myFunction
```

In case it's necessary, a decorator could wrap the exported function to allow it only to be accessed during testing.
