#!/usr/bin/env python3
import sys

def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <number>")
        sys.exit(1)

    number = float(sys.argv[1])
    result = int(number / 6 * 10**18)
    print(result)

if __name__ == "__main__":
    main()
