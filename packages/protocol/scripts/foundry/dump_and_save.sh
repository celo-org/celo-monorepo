if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <output_file_name>"
    exit 1
fi

echo "Dumping state..."
cast rpc anvil_dumpState --rpc-url $ANVIL_RPC_URL > $TMP_FOLDER/tmp_state
hex_data=$(cat $TMP_FOLDER/tmp_state)
echo "Saving state to $TMP_FOLDER/$1.gz"
echo $hex_data | xxd -r -p > $TMP_FOLDER/$1.gz
echo "uzipping..."
gunzip $TMP_FOLDER/$1.gz


rm $TMP_FOLDER/tmp_state
