#!/usr/bin/env python
""" 
Create the regexes to use in the Atom language-stan grammar

This is a hack until I translate it into coffescript script that directly outputs the .cson grammar.
"""
import json
import re
import sys

def kw2re(x):
    return r'"\\b(%s)\\b"' % '|'.join(x)

def patterns(filename):
    with open(filename, "r") as f:
        data = json.load(f)

    types = set()
    for k in data['types']:
        for x in data['types'][k]:
            types.add(x)
    types = sorted(list(types))
    print("types: " + kw2re(types))
        
    print("blocks", kw2re(re.sub('\s+', r'\\\\s+', x) for x in data['blocks']))
    print("keywords-range-constraings: " + kw2re(data['keywords']['range_constraints']))
    print("keywords-special-functions: " + kw2re(data['keywords']['functions']))
    print("keywords-control-flow:" + kw2re(data['keywords']['control']))
    print("keywords-others: " + kw2re(data['keywords']['other']))
    print("cpp-reserved: " + kw2re(data['reserved']['cpp']))
    print("stan-reserved " + kw2re(data['reserved']['stan']))
    print("constants: " + kw2re(data['constants']))

    excluded_fxn = data['keywords']['functions'] + data['operator_functions'] + data['constants']
    functions = [x for x in data['functions'] 
                 if x not in excluded_fxn]
    print("functions: " + kw2re(functions))

    print("distribution: " + kw2re(data['distributions']))

def main():
    src = 'stan-language-definitions/stan_lang.json'
    patterns(src)

if __name__ == '__main__':
    main()

