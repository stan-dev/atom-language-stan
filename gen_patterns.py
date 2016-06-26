#!/usr/bin/env python
"""
Create the regexes to use in the Atom language-stan grammar

This is a hack until I translate it into coffescript script that directly outputs the .cson grammar.
"""
import json
import re
import sys

def kw2re(x):
    return r'(%s)' % '|'.join(x)

def patterns(filename):
    with open(filename, "r") as f:
        data = json.load(f)

    functions = [k for k, v in data['functions'].items() if not v['operator']]
    distributions = [v['sampling'] for k, v in data['functions'].items() if v['sampling']]
    print("functions: \n" + r"'match': '\\b" + kw2re(functions) + r"\\b'")
    print()
    print("distributions: \n" + r"'match': '\\b(~)\\s*" + kw2re(distributions) + r"\\b'")
    print()
    operators = []
    for x in sorted(data['operators'], key = len, reverse = True):
        if x == '\\':
            x = r'\\\\'
        elif x == '^':
            x = r'\\^'
        else:
            x = ''.join('[%s]' % el for el in x)

        operators.append(x)
    print("operators: \n" + r"'match': '\\b" + kw2re(operators) + r"\\b'")
    


def main():
    src = 'stan-language-definitions/stan_lang.json'
    patterns(src)

if __name__ == '__main__':
    main()
