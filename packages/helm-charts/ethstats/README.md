# ethstats

## Deploying on existing testnet

Originally, the resources in this chart were in the `testnet` helm chart.
When upgrading a testnet that is currently running that was not deployed
with ethstats as a separate helm chart, you must:

1.  Upgrade the testnet: `celotool deploy upgrade testnet -e MY_ENV`. This
    will remove the previous ethstats resources, even if there are otherwise no
    changes to the testnet. Nodes in the testnet require an ethstats secret that
    will be missing, so if any nodes are restarted they will hang until the secret
    is created in the next step.

2.  Deploy the new separate ethstats: `celotool deploy initial ethstats -e MY_ENV`.
