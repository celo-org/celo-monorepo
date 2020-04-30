import urllib.request
import sys
import json
from certoraUtils import run_cmd_slim
import traceback
import os

args = sys.argv[1:]
username = args[0]
runname = args[1]
key = os.getenv("CERTORAKEY")
OUT_FILE = "output.json"

opener = urllib.request.build_opener()
opener.addheaders.append(('Cookie', 'certoraKey=%s' % (key)))
uri = "https://asa.certora.com/job/%s/%s" % (username, runname)

with opener.open(uri) as response:
    try:
        responsestr = response.read().decode("utf-8")
        data = json.loads(responsestr)
        with open('.list.txt', 'w') as listFile:
            for x in data["fileURLs"]:
                if x.endswith(OUT_FILE):
                    listFile.write(x.replace("http", "https"))
                    listFile.write("\n")
    except Exception:
        print("Failed to get response for %s, Error:" % (uri))
        print(traceback.format_exc())
        sys.exit(1)

cmd_to_run = 'wget --no-check-certificate -x -i .list.txt --header "Cookie: certoraKey=%s" -O %s' % (key, OUT_FILE)
run_cmd_slim(cmd_to_run, 'wget.file')
