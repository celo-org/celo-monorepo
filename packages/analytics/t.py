import argparse
parser = argparse.ArgumentParser()
parser.add_argument('-w', '--writer', help="Team Player.")
args = parser.parse_args()


if args.writer == 'Shubham':
    print('Technical Author.')
print(args.writer)

