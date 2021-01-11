set -e
export COLUMNS=88
yarn oclif-dev readme --multi --dir=../docs/command-line-interface
yarn prettier --write ../docs/command-line-interface/*
sed -i.bak '/^- \[/d' ../docs/command-line-interface/*
rm -rf ../docs/command-line-interface/*.bak
