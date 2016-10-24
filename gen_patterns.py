#!/usr/bin/env python
"""
Create the regexes to use in the Atom language-stan grammar

This is a hack until I translate it into coffescript script that directly outputs the .cson grammar.
"""
import json
import re
import sys

def kw2re(x):
    return r'(%s)' % '|'.join(sorted(list(set(x))))

def patterns(filename):
    with open(filename, "r") as f:
        data = json.load(f)

    functions = [k for k, v in data['functions'].items()
                    if not v['operator'] and not v['deprecated'] and not v['keyword']]
    deprecated_functions = [k for k, v in data['functions'].items()
                                    if not v['operator'] and v['deprecated']]
    distributions = [v['sampling'] for k, v in data['functions'].items()
                            if v['sampling'] and not v['deprecated']]
    print("functions: \n" + r"'match': '\\b" + kw2re(functions) + r"\\b'")
    print()
    print("distributions: \n" + r"'match': '([~])\\s*" + kw2re(distributions) + r"\\b'")
    print()
    print("deprecated_functions: \n" + r"'match': '\\b" + kw2re(deprecated_functions) + r"\\b'")
    print()


def main():
    src = 'stan-language-definitions/stan_lang.json'
    patterns(src)

if __name__ == '__main__':
    main()
