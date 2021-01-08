set -e
export COLUMNS=88
yarn oclif-dev readme --multi --dir=../docs/command-line-interface
yarn prettier --write ../docs/command-line-interface/*
sed -i '' '/^- \[/d' ../docs/command-line-interface/*
