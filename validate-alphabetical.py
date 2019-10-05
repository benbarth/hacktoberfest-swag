#!/usr/bin/env python

import sys

def main():
    if len(sys.argv) != 2:
        print("Missing argument: Markdown file path")
        sys.exit(1)

    isAlphabetical = validateAlphabetical(sys.argv[1])

    if not isAlphabetical:
        sys.exit(1)

def validateAlphabetical(markdownFilePath):
    r = open(markdownFilePath, 'r')
    lines = r.readlines()

    values = []

    tableRow = -1
    for line in lines:
        if '|' in line:
            if tableRow > 0:
                columns = line.split('|')
                if len(columns) > 1:
                    firstColumn = columns[1].strip()
                    values.append(firstColumn)
            tableRow += 1
    
    if values != sorted(values, key=str.casefold):
        print ("Error: The first column of the table is not alphabetical.")

        for value in values:
            print(value)

        return False
    
    return True

if __name__ == '__main__': 
    main()
