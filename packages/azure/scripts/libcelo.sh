get_secret () {
    local vault=$1
    local key=$2

    local token=$(curl -s 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net' -H Metadata:true)
    local access_token=$(echo $token | jq -r '.access_token')
    local result=$(curl -s -H "Authorization: Bearer $access_token" https://${vault}.vault.azure.net/secrets/${key}?api-version=2016-10-01)
    echo $(echo $result | jq -r '.value')
}

generate_password() {
    # Generate 24 character long password using base64 characters.
    dd bs=18 count=1 if=/dev/urandom status=none | base64
}
