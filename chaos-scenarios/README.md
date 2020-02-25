# Chaos Scenarios

The next chaos scenarios are crd definitions used by [chaos-mesh](https://github.com/pingcap/chaos-mesh).

## Deploying on existing testnet

Follow the next steps to apply any scenario to an existing kubernetes testnet:

1.  Deploy the `chaos-mesh` package (`celotooljs.sh deploy initial chaos-mesh -e ${ENV}`)

1.  Modify the test yaml (test conditions, namespace, component to apply, etc.)

1.  Apply the scenario (`kubectl -n ${ENV} apply -f ${TEST_SCENARIO_YAML}`)

1.  Evaluate the impact of the scenario. Once you are done with these conditions, you can remove the effects with `kubectl -n ${ENV} delete -f ${TEST_SCENARIO_YAML}`
