#!/bin/bash

set -e

echo "Node version: $(node --version)"
echo "Yarn version: $(yarn --version)"

# Install nvm if not already available
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Use Node.js v18.16.1
nvm install v18.16.1
nvm use v18.16.1
