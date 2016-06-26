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

    types = set()
    for k in data['types']:
        for x in data['types'][k]:
            types.add(x)
    types = sorted(list(types))

    distributions = [re.sub(r'_p(dm)f$', '', x)
                     for x in data['functions']['names']['density']]

    print("types: " + r'\\b' + kw2re(types) + r'\\b')
    print("blocks: " + r'\\b' + kw2re(re.sub(r'\s+', r'\\\\s+', x) for x in data['blocks']) + r'\\b')
    print("keywords-range-constraings: " + r'\\b' + kw2re(data['keywords']['range_constraints']) + r'\\b')
    print("keywords-special-functions: " + r'\\b' + kw2re(data['keywords']['functions']) + r'\\b')
    print("keywords-control-flow:" + r'\\b' + kw2re(data['keywords']['control']) + r'\\b')
    print("keywords-others: " + r'\\b' + kw2re(data['keywords']['other']) + r'\\b')
    print("cpp-reserved: " + r'\\b' + kw2re(data['reserved']['cpp']) + r'\\b')
    print("stan-reserved: " + r'\\b' + kw2re(data['reserved']['stan']) + r'\\b')
    print("functions: " + r'\\b' + kw2re(data['functions']['names']['all']) + r'\\b')
    print("distributions: " + r'\\b(~)\\s*' + kw2re(distributions) + r'\\b')
    operators = []
    for x in sorted(data['operators'], key = len, reverse = True):
        if x == '\\':
            x = r'\\\\'
        elif x == '^':
            x = r'\\^'
        else:
            x = ''.join('[%s]' % el for el in x)

        operators.append(x)
    print("operators: " + r'\\b' + kw2re(operators) + r'\\b')


def main():
    src = 'stan-language-definitions/stan_lang.json'
    patterns(src)

if __name__ == '__main__':
    main()
