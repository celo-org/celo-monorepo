# TypeScript Style Guide

### Function parameters

_Vanilla parameters_ are prefered over Object Destructuring.

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

This is for simplicity, with fewer lines and some evidenece shows it's [faster](https://codeburst.io/es6s-function-destructuring-assignment-is-not-free-lunch-19caacc18137).

### Function definitions: Arrow functions vs Vanilla functions

In the root scope, _Vanilla fuctions_ are prefered over Arrow fuctions.

This is because it's consistent with generator functions, simpler to understand, easier to debug, supports recursion and functions are hoisted, meaning no concern about definition order.

### Class methods: anonymous functions vs native methods

Anonnymus functions are the prefered way. As shown in the example:

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

This is the prefered way:

```
const myFunction{...}
export _myFunction = myFunction
```

In case it's necesarry, a decorator could wrap the exported function to allow it only to be accessed during testing.
