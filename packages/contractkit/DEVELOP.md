# Developer Guide

## Running Tests

To run test, we first need to generate a devchain snapshot:

`yarn test:prepare`

and then:

`yarn test`

## Documenting Code

To generate docs from [TSdoc](https://github.com/microsoft/tsdoc) annotations using [typedoc](https://typedoc.org/):

`yarn docs`

To customize this generation, see the [linkdocs](./scripts/linkdocs.ts) script.