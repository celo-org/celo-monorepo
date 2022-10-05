#!/bin/sh
echo Creating Grafana tag

REQUEST=$(curl "$GRAFANA_API_ENDPOINT/api/annotations" \
  --request "POST" \
  --header "authorization: Bearer $GRAFANA_API_TOKEN" \
  --header "content-type: application/json" \
  --data @- << EOF
  {
    "text": "Deployed $CELO_DEPLOYMENT by $GCLOUD_ACCOUNT with commit: \n \n <a href=\"https://github.com/celo-org/blockscout/commit/$TAG\"> $TAG</a>\n ",
    "tags": [
      "deployment",
      "$CELO_DEPLOYMENT"
    ]
  }
EOF
)