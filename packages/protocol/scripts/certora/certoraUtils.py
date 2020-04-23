import json
import os
import sys
import subprocess
import platform
from datetime import datetime
import shlex

from typing import Any, Dict, List

DEBUG = False
config_path = "%s/%s" % (os.getcwd().replace("\\", "/"), ".certora_config2")

DEFAULT_CONF = "default.conf"
MANDATORY_CONTRACTS = "contracts"
OPTION_OUTPUT = "output"
OPTION_OUTPUT_FOLDER = "output_folder"
OPTION_OUTPUT_VERIFY = "output_verify"
OPTION_PATH = "path"
OPTION_PACKAGES_PATH = "packages_path"
OPTION_PACKAGES = "packages"
OPTION_SOLC_MAP = "solc_map"
OPTION_SOLC = "solc"
OPTION_LINK = "link"
OPTION_ADDRESS = "address"
OPTION_VERIFY = "verify"
OPTION_ASSERT = "assert"
OPTION_CACHE = "cache"
OPTION_LINK_CANDIDATES = "linkCandidates"
OPTION_SOLC_ARGS = "solc_args"
ENVVAR_CERTORA = "CERTORA"

def fatal_error(s: str) -> None:
    print(s)
    if DEBUG:
        raise Exception(s)
    sys.exit(1)

def debug_print(s: str) -> None:
    if DEBUG:
        print(s)

def is_windows() -> bool:
    return platform.system() == 'Windows'

def get_file_name(file: str) -> str:
    return ''.join(file.split("/")[-1])

def get_file_basename(file: str) -> str:
    return ''.join(file.split("/")[-1].split(".")[0:-1])

def get_file_extension(file: str) -> str:
    return file.split("/")[-1].split(".")[-1]

def safe_create_dir(path: str) -> None:
    try:
        os.mkdir(path)
    except OSError:
        debug_print("Failed to create directory %s: %s" % (path, sys.exc_info()))
        pass

def print_failed_to_run(cmd: str) -> None:
    print()
    print("Failed to run %s" % (cmd, ))
    if (is_windows() and cmd.find('solc') != -1 and cmd.find('exe') == -1):
        print("did you forget the .exe extension for solcXX.exe??")
    print()

def run_cmd(cmd: str, name: str, input: bytes = None) -> None:
    debug_print("Running cmd %s" % (cmd,))

    stdout_name = "%s/%s.stdout" % (config_path, name)
    stderr_name = "%s/%s.stderr" % (config_path, name)
    debug_print("stdout, stderr = %s,%s" % (stdout_name, stderr_name))

    with open(stdout_name, 'w+') as stdout:
        with open(stderr_name, 'w+') as stderr:
            try:
                args = prepare_call_args(cmd)
                exitcode = subprocess.run(args, stdout=stdout, stderr=stderr, input=input).returncode
                if exitcode:
                    print("Failed to run %s" % cmd)
                    with open(stderr_name, 'r') as stderr_read:
                        for line in stderr_read:
                            print(line)
                    sys.exit(1)
                else:
                    debug_print("Exitcode %d" % (exitcode,))
            except Exception:
                print_failed_to_run(cmd)
                raise

def run_cmd_slim(cmd: str, name: str) -> None:
    try:
        exitcode = subprocess.call(shlex.split(cmd))
        if exitcode:
            print("Failed to run %s, got exitcode %d" % (cmd, exitcode))
            sys.exit(1)
        else:
            debug_print("Exitcode %d" % (exitcode,))
    except Exception:
        print_failed_to_run(cmd)
        raise

def current_conf_to_file(parsed_options: Dict[str, Any], files: List[str], fileToContractName: Dict[str, str]) -> None:
    out = {}

    def simple_set(option: str) -> None:
        if option in parsed_options:
            out[option] = parsed_options[option]

    simple_set(OPTION_CACHE)
    simple_set(OPTION_OUTPUT)
    simple_set(OPTION_OUTPUT_FOLDER)
    simple_set(OPTION_OUTPUT_VERIFY)
    simple_set(OPTION_PACKAGES_PATH)
    simple_set(OPTION_SOLC)
    simple_set(OPTION_SOLC_MAP)
    simple_set(OPTION_PATH)
    simple_set(OPTION_SOLC_ARGS)

    if OPTION_LINK in parsed_options:
        out[OPTION_LINK] = {}
        for link in parsed_options[OPTION_LINK]:
            k, f_v = link.split(":", 2)
            f, v = f_v.split("=", 2)

            if k in out[OPTION_LINK]:
                out[OPTION_LINK][k][f] = v
            else:
                out[OPTION_LINK][k] = {f: v}

    if OPTION_PACKAGES in parsed_options:
        out[OPTION_PACKAGES] = {}
        for package_entry in parsed_options[OPTION_PACKAGES].split(" "):
            package, package_path = package_entry.split("=", 2)
            out[OPTION_PACKAGES][package] = package_path

    if OPTION_ADDRESS in parsed_options:
        out[OPTION_ADDRESS] = {}
        for manual_address_entry in parsed_options[OPTION_ADDRESS]:
            out[OPTION_ADDRESS][manual_address_entry] = parsed_options[OPTION_ADDRESS][manual_address_entry]

    if OPTION_VERIFY in parsed_options:
        out[OPTION_VERIFY] = {}
        for verquery_entry in parsed_options[OPTION_VERIFY]:
            contract, spec = verquery_entry.split(":", 2)
            if contract in out[OPTION_VERIFY]:
                out[OPTION_VERIFY][contract].append(spec)
            else:
                out[OPTION_VERIFY][contract] = [spec]

    if OPTION_ASSERT in parsed_options:
        out[OPTION_ASSERT] = parsed_options[OPTION_ASSERT]

    # TODO: Add OPTION_LINK_CANDIDATES handling from comamnd line to conf

    # finally... files:
    out[MANDATORY_CONTRACTS] = []
    for file in files:
        out[MANDATORY_CONTRACTS].append("%s:%s" % (file, fileToContractName[file]))

    safe_create_dir(".last_confs")
    out_file_name = ".last_confs/last_conf_%s.conf" % (datetime.now().strftime("%d_%m_%Y__%H_%M_%S"))
    with open(out_file_name, 'w+') as out_file:
        json.dump(out, out_file, indent=4, sort_keys=True)

def handle_file_list(file_list: List[str], files: List[str], fileToContractName: Dict[str, str]) -> None:
    for arg in file_list:
        if arg.startswith("--"):
            break

        if is_windows():
            path_normalized_file = arg.replace("\\", "/")
        else:
            path_normalized_file = arg

        if ":" in path_normalized_file:
            contract_path = path_normalized_file.split(":")[0]
            contract_name = path_normalized_file.split(":")[1]
            files.append(contract_path)
            fileToContractName[contract_path] = contract_name
        else:
            files.append(path_normalized_file)
            fileToContractName[path_normalized_file] = get_file_basename(path_normalized_file)

# features: read from conf. write last to last_conf and to conf_date..
def read_from_conf(conf_file_name: str, parsed_options: Dict[str, Any], files: List[str],
                   fileToContractName: Dict[str, str]) -> None:
    with open(conf_file_name, "r") as conf_file:
        json_obj = json.load(conf_file)
        if MANDATORY_CONTRACTS not in json_obj:
            raise Exception("Configuration file %s must specify contract files in \"contracts\"" % (conf_file_name))

        handle_file_list(json_obj[MANDATORY_CONTRACTS], files, fileToContractName)

        if OPTION_SOLC in json_obj:
            parsed_options[OPTION_SOLC] = json_obj[OPTION_SOLC]

        if OPTION_SOLC_ARGS in json_obj:
            parsed_options[OPTION_SOLC_ARGS] = json_obj[OPTION_SOLC_ARGS]

        if OPTION_LINK in json_obj:
            flattened_links = []
            for linked in json_obj[OPTION_LINK]:
                for field in json_obj[OPTION_LINK][linked]:
                    flattened_links.append("%s:%s=%s" % (linked, field, json_obj[OPTION_LINK][linked][field]))

            parsed_options[OPTION_LINK] = flattened_links

        if OPTION_ADDRESS in json_obj:
            parsed_options[OPTION_ADDRESS] = {}
            for entry in json_obj[OPTION_ADDRESS]:
                parsed_options[OPTION_ADDRESS][entry] = json_obj[OPTION_ADDRESS][entry]

        if OPTION_PACKAGES in json_obj:
            flattened_packages = []
            for package in json_obj[OPTION_PACKAGES]:
                package_loc = json_obj[OPTION_PACKAGES][package]
                if package_loc.find("$PWD") != -1:
                    package_loc = package_loc.replace("$PWD", os.getcwd().replace("\\", "/"))
                flattened_packages.append("%s=%s" % (package, package_loc))
            parsed_options[OPTION_PACKAGES] = ' '.join(flattened_packages)

        if OPTION_VERIFY in json_obj:
            flattened_verification_queries = []
            for contract_verquery in json_obj[OPTION_VERIFY]:
                for specfile in json_obj[OPTION_VERIFY][contract_verquery]:
                    flattened_verification_queries.append("%s:%s" % (contract_verquery, specfile))
            parsed_options[OPTION_VERIFY] = flattened_verification_queries

        if OPTION_ASSERT in json_obj:
            parsed_options[OPTION_ASSERT] = json_obj[OPTION_ASSERT]

        if OPTION_LINK_CANDIDATES in json_obj:
            parsed_options[OPTION_LINK_CANDIDATES] = json_obj[OPTION_LINK_CANDIDATES]

        if OPTION_CACHE in json_obj:
            parsed_options[OPTION_CACHE] = json_obj[OPTION_CACHE]

        if OPTION_PATH in json_obj:
            parsed_options[OPTION_PATH] = json_obj[OPTION_PATH].replace("$PWD", os.getcwd().replace("\\", "/"))


"""
 Hack to avoid problems with the parameter of --solc_args (problem is that the
 parameter looks like an option).

 Changes its parameter object (a list) in place.

 What this actually does:
   look for the argument "--solc_args"
   prepend the argument that immediately follows "--solc_args" with a space, so
   it is not recognized as an option by the argument parsing logic.

 source of inspiration:
   https://stackoverflow.com/questions/16174992/cant-get-argparse-to-read-quoted-string-with-dashes-in-it
"""
def nestedOptionHack(args: List[str]) -> None:
    for i in range(len(args)):
        debug_print(args[i])
        if (args[i] == '--' + OPTION_SOLC_ARGS):
            try:
                # TODO: throw a warning if args[i+1] matches one of the options of this script
                args[i + 1] = ' ' + args[i + 1]
            except Exception:
                print("Error: '-solc_args' needs a parameter, thus cannot be the last argument")
                sys.exit()

def sanitize_path(pathString: str) -> str:
    return pathString.replace("\\", "/")

def prepare_call_args(cmd: str) -> List[str]:
    split = shlex.split(cmd)
    if (split[0].endswith('.py')):
        # sys.executable returns a full path to the current running python, so it's good for running our own scripts
        certora_root = get_certora_root_directory()
        args = [sys.executable] + [sanitize_path(os.path.join(certora_root, split[0]))] + split[1:]
    else:
        args = split
    return args

def get_certora_root_directory() -> str:
    return os.getenv(ENVVAR_CERTORA, os.getcwd())
