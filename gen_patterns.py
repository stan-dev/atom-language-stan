#!/usr/bin/env python
"""Create the regexes to use in the Atom language-stan grammar.

This is a hack until I translate it into coffescript script that directly
outputs the .cson grammar.
"""
import json


def kw2re(x):
    """Convert a list of keywords to a regex."""
    return r'(%s)' % '|'.join(sorted(list(set(x))))


def patterns(filename):
    """Print patterns."""
    with open(filename, "r") as f:
        data = json.load(f)

    functions = [
        k for k, v in data['functions'].items()
        if not k.startswith('operator') and not v['deprecated']
        and not v['keyword']
    ]
    deprecated_functions = data['deprecated']
    distributions = [
        v['sampling'] for k, v in data['functions'].items() if v['sampling']
    ]
    print("functions: \n" + r"'match': '\\b" + kw2re(functions) + r"\\b'")
    print()
    print("distributions: \n" + r"'match': '\\b(~)\\s*" + kw2re(distributions)
          + r"\\b'")
    print()
    print("deprecated_functions: \n" + r"'match': '\\b" +
          kw2re(deprecated_functions) + r"\\b'")
    print()


def main():
    """Command line interface."""
    src = 'stan-language-definitions/stan_lang.json'
    patterns(src)


if __name__ == '__main__':
    main()
