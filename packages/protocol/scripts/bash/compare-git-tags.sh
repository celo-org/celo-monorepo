#!/bin/bash

# Function to print usage
usage() {
  echo "Usage: $0 <tag/branch1> <tag/branch2>"
  exit 1
}

# Check if the correct number of arguments are provided
if [ "$#" -ne 2 ]; then
  usage
fi

# Assign input arguments to variables
BRANCH1=$1
BRANCH2=$2

# Fetch the latest changes from the remote repository
git fetch

# Get the list of changed Solidity files between the two branches/tags
# Exclude .t.sol files and files containing test/Test in the name
# Include only those in contracts or contracts-0.8 folders, regardless of their depth in the directory structure
CHANGED_FILES=$(git diff --name-only "$BRANCH1" "$BRANCH2" | grep -E '(.*/contracts/|.*/contracts-0.8/).*\.sol$' | grep -v '\.t\.sol$' | grep -v -i 'test')

# Print the changed Solidity files
echo "Changed Solidity files between $BRANCH1 and $BRANCH2 (excluding *.t.sol and files containing 'test'/'Test' and including only contracts or contracts-0.8 folders):"

CHANGED_FILES=$(echo "$CHANGED_FILES" | sed 's|^packages/protocol/||')
echo "$CHANGED_FILES"

# Initialize an empty string for storing commits
COMMITS=""

# Loop through each changed file and find the commits affecting those files between the two branches
for file in $CHANGED_FILES; do
  FILE_COMMITS=$(git log --pretty=format:"%h %s" "$BRANCH1..$BRANCH2" -- "$file")
  COMMITS+=$FILE_COMMITS
  COMMITS+="\n"
done

# Extract unique commits from the collected commit messages
UNIQUE_COMMITS=$(echo -e "$COMMITS" | sort | uniq)

echo ""
echo ""
echo "********************************************"
echo ""
echo "PRs that made these changes:"
echo "$UNIQUE_COMMITS"
