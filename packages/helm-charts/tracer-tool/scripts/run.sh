FIRST_ACCOUNT="0x4da58d267cd465b9313fdb19b120ec591d957ad2";
SECOND_ACCOUNT="0xc70947239385c2422866e20b6cafffa29157e4b3";
CELOTOOL="/celo-monorepo/packages/celotool/bin/celotooljs.sh";
GETH_DIR="/celo-monorepo/node_modules/@celo/geth";
DATA_DIR="/geth-data";
ENV_NAME="$(cat /root/envname)"

wget https://dl.google.com/go/go1.11.5.linux-amd64.tar.gz;
tar xf go1.11.5.linux-amd64.tar.gz -C /tmp;
PATH=$PATH:/tmp/go/bin;

cd "/celo-monorepo" && yarn run build-sdk $ENV_NAME;

mkdir $DATA_DIR;

$CELOTOOL geth build --geth-dir $GETH_DIR -c &&
$CELOTOOL geth init --geth-dir $GETH_DIR --data-dir $DATA_DIR -e $ENV_NAME --genesis "/geth/genesis.json" --fetch-static-nodes-from-network=false;

cat /root/pk2740 >> $DATA_DIR/keystore/UTC--2019-03-02T04-27-40.724063000Z--c70947239385c2422866e20b6cafffa29157e4b3;
cat /root/pk2745 >> $DATA_DIR/keystore/UTC--2019-03-02T04-27-45.410695000Z--4da58d267cd465b9313fdb19b120ec591d957ad2;
cat /root/staticnodes >> $DATA_DIR/static-nodes.json;

echo "Running geth...";

$CELOTOOL geth run --geth-dir $GETH_DIR --data-dir $DATA_DIR --sync-mode celolatest --verbosity 1 &

sleep 15;

$CELOTOOL geth trace $FIRST_ACCOUNT $SECOND_ACCOUNT --data-dir $DATA_DIR -e $ENV_NAME
