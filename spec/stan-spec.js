/* eslint-env jasmine */
/* globals atom,grammar,waitsForPromise */
// const path = require('path')
// const grammarTest = require('atom-grammar-test')

function scope (x) {
  return ['source.stan'].concat(x)
}

describe('Stan grammar', function () {
  beforeEach(function () {
    waitsForPromise(() => atom.packages.activatePackage('language-stan'))
    runs(() => {
      grammar = atom.grammars.grammarForScopeName('source.stan') // eslint-disable-line no-global-assign
    })
  })

  it('parses the grammar', function () {
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe('source.stan')
  })

  // grammarTest(path.join(__dirname, 'fixtures/expressions.stan'))

  describe('Comments', function () {
    it('tokenizes // comments', function () {
      const {tokens} = grammar.tokenizeLine('// comment')
      expect(tokens[0]).toEqual({
        value: '//',
        scopes: ['source.stan', 'comment.line.double-slash.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[1]).toEqual({
        value: ' comment',
        scopes: ['source.stan', 'comment.line.double-slash.stan']
      })
    })

    it('tokenizes number comments', function () {
      const {tokens} = grammar.tokenizeLine('# comment')
      expect(tokens[0]).toEqual({
        value: '#',
        scopes: ['source.stan', 'comment.line.number-sign.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[1]).toEqual({
        value: ' comment',
        scopes: ['source.stan', 'comment.line.number-sign.stan']
      })
    })

    it('tokenizes /* */ comments', function () {
      let {tokens} = grammar.tokenizeLine('/**/')
      expect(tokens[0]).toEqual({
        value: '/*',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[1]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      });

      ({tokens} = grammar.tokenizeLine('/* foo */'))
      expect(tokens[0]).toEqual({
        value: '/*',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[1]).toEqual({
        value: ' foo ',
        scopes: ['source.stan', 'comment.block.stan']
      })
      expect(tokens[2]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      })
    })

    it('tokenizes /** */ comments', function () {
      let {tokens} = grammar.tokenizeLine('/***/')
      expect(tokens[0]).toEqual({
        value: '/**',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[1]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });

      ({tokens} = grammar.tokenizeLine('/** foo */'))
      expect(tokens[0]).toEqual({
        value: '/**',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[1]).toEqual({
        value: ' foo ',
        scopes: ['source.stan', 'comment.block.documentation.stan']
      })
      expect(tokens[2]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });

      ({tokens} = grammar.tokenizeLine('/** @param */'))
      expect(tokens[0]).toEqual({
        value: '/**',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      })
      expect(tokens[2]).toEqual({
        value: '@param',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'storage.type.class.standoc']
      })
      expect(tokens[3]).toEqual({
        value: ' ',
        scopes: ['source.stan', 'comment.block.documentation.stan']
      })
      expect(tokens[4]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      })
    })
  })

  describe('Identifiers', () => {
    const identifiers = [
      'a',
      'a3',
      'snake_case',
      'camelCase',
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789',
      'ifff', // starts with keyword
      'butfor' // ends with keyword
    ]

    const illegalIds = [
      'a__',
      '3abc',
      '_abc3'
    ]

    for (let x of identifiers) {
      let expected
      it(`recognizes ${x} as an identifier`, () => {
        expected = [[x, ['source.stan', 'meta.identifier.variable.stan']]]
        let {tokens} = grammar.tokenizeLine(`${x}`)
        for (let i = 1; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({'value': expected[i][0], 'scopes': x[i][1]})
        }
      })
    }

    for (let x of illegalIds) {
      let expected
      it(`recognizes ${x} as an illegal-identifier`, () => {
        expected = [[x, ['source.stan', 'invalid.illegal.variable.stan']]]
        let {tokens} = grammar.tokenizeLine(`${x}`)
        for (let i = 1; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({'value': expected[i][0], 'scopes': x[i][1]})
        }
      })
    }
  })

  describe('Operators', () => {
    describe('Logical Infix Operators', () => {
      let operators = [
        '&&', '||', '>', '>=', '<', '<=', '>'
      ]
      for (let op of operators) {
        let text = `a ${op} b`
        it(`tokenizes operator in "${text}"`, () => {
          let {tokens} = grammar.tokenizeLine(text)
          let expected = [
            ['a', scope(['meta.identifier.variable.stan'])],
            [' ', scope([])],
            [op, scope(['keyword.operator.logical.stan'])],
            [' ', scope([])],
            ['b', scope(['meta.identifier.variable.stan'])]
          ]
          for (let i = 0; i < tokens.length; i++) {
            expect(tokens[i]).toEqual({
              value: expected[i][0],
              scopes: expected[i][1]
            })
          }
        })
      }
    })

    describe('Arithmetic Infix Operators', () => {
      let operators = [
        '+', '-', '*', '/', '.*', './', '^', '\\', '%'
      ]
      for (let op of operators) {
        let text = `a ${op} b`
        it(`tokenizes operator in "${text}"`, () => {
          let {tokens} = grammar.tokenizeLine(text)
          let expected = [
            ['a', scope(['meta.identifier.variable.stan'])],
            [' ', scope([])],
            [op, scope(['keyword.operator.arithmetic.stan'])],
            [' ', scope([])],
            ['b', scope(['meta.identifier.variable.stan'])]
          ]
          for (let i = 0; i < tokens.length; i++) {
            expect(tokens[i]).toEqual({
              value: expected[i][0],
              scopes: expected[i][1]
            })
          }
        })
      }
    })

    describe('Arithmetic Prefix Operators', () => {
      let operators = ['+', '-']
      for (let op of operators) {
        let text = `${op}1`
        it(`tokenizes prefix operator in "${text}"`, () => {
          let {tokens} = grammar.tokenizeLine(text)
          let expected = [
            [op, scope(['keyword.operator.arithmetic.stan'])],
            ['1', scope(['constant.numeric.integer.stan'])]
          ]
          for (let i = 0; i < tokens.length; i++) {
            expect(tokens[i]).toEqual({
              value: expected[i][0],
              scopes: expected[i][1]
            })
          }
        })
      }
    })

    describe('Logical Prefix Operators', () => {
      let operators = ['!']
      for (let op of operators) {
        let text = `${op}a`
        it(`tokenizes prefix operator in "${text}"`, () => {
          let {tokens} = grammar.tokenizeLine(text)
          let expected = [
            [op, scope(['keyword.operator.logical.stan'])],
            ['a', scope(['meta.identifier.variable.stan'])]
          ]
          for (let i = 0; i < tokens.length; i++) {
            expect(tokens[i]).toEqual({
              value: expected[i][0],
              scopes: expected[i][1]
            })
          }
        })
      }
    })

    describe('Arithmetic Postfix Operators', () => {
      let operators = ['\'']
      for (let op of operators) {
        let text = `a${op}`
        it(`tokenizes prefix operator in "${text}"`, () => {
          let {tokens} = grammar.tokenizeLine(text)
          let expected = [
            ['a', scope(['meta.identifier.variable.stan'])],
            [op, scope(['keyword.operator.arithmetic.stan'])]
          ]
          for (let i = 0; i < tokens.length; i++) {
            expect(tokens[i]).toEqual({
              value: expected[i][0],
              scopes: expected[i][1]
            })
          }
        })
      }
    })

    describe('Ternary operator', () => {
      let text = 'a ? b : c'
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = [
          ['a', scope(['meta.identifier.variable.stan'])],
          [' ', scope([])],
          ['?', scope(['keyword.operator.ternary.stan'])],
          [' ', scope([])],
          ['b', scope(['meta.identifier.variable.stan'])],
          [' ', scope([])],
          [':', scope(['keyword.operator.ternary.stan'])],
          [' ', scope([])],
          ['c', scope(['meta.identifier.variable.stan'])]
        ]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    })
  })

  describe('Indexed expression', () => {
    let text = 'a[b, 2, :4]'
    it(`Tokenizes "${text}"`, () => {
      let {tokens} = grammar.tokenizeLine(text)
      let expected = [
        ['a', scope(['meta.identifier.variable.stan'])],
        ['[', scope(['punctuation.section.brackets.begin.bracket.square.stan'])],
        ['b', scope(['meta.identifier.variable.stan'])],
        [',', scope(['punctuation.delimiter.comma.stan'])],
        [' ', scope([])],
        ['2', scope(['constant.numeric.integer.stan'])],
        [',', scope(['punctuation.delimiter.comma.stan'])],
        [' ', scope([])],
        [':', scope(['keyword.operator.colon.stan'])],
        ['4', scope(['constant.numeric.integer.stan'])],
        [']', scope(['punctuation.section.brackets.end.bracket.square.stan'])]
      ]
      for (let i = 0; i < tokens.length; i++) {
        expect(tokens[i]).toEqual({
          value: expected[i][0],
          scopes: expected[i][1]
        })
      }
    })

    it(`Tokenizes index with ternary operator`, () => {
      let text = 'a[a ? b : c, b:c]'
      let {tokens} = grammar.tokenizeLine(text)
      let expected = [
        ['a', scope(['meta.identifier.variable.stan'])],
        ['[', scope(['punctuation.section.brackets.begin.bracket.square.stan'])],
        ['a', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        ['?', scope(['keyword.operator.ternary.stan'])],
        [' ', scope([])],
        ['b', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        [':', scope(['keyword.operator.ternary.stan'])],
        [' ', scope([])],
        ['c', scope(['meta.identifier.variable.stan'])],
        [',', scope(['punctuation.delimiter.comma.stan'])],
        [' ', scope([])],
        ['b', scope(['meta.identifier.variable.stan'])],
        [':', scope(['keyword.operator.colon.stan'])],
        ['c', scope(['meta.identifier.variable.stan'])],
        [']', scope(['punctuation.section.brackets.end.bracket.square.stan'])]
      ]
      for (let i = 0; i < tokens.length; i++) {
        expect(tokens[i]).toEqual({
          value: expected[i][0],
          scopes: expected[i][1]
        })
      }
    })
  })

  describe('Parenthized expression', () => {
    it('Tokenizes "(a)"', () => {
      let text = '(a)'
      let {tokens} = grammar.tokenizeLine(text)
      let expected = [
        ['(', scope(['punctuation.section.parens.begin.bracket.round.stan'])],
        ['a', scope(['meta.identifier.variable.stan'])],
        [')', scope(['punctuation.section.parens.end.bracket.round.stan'])]
      ]
      for (let i = 0; i < tokens.length; i++) {
        expect(tokens[i]).toEqual({
          value: expected[i][0],
          scopes: expected[i][1]
        })
      }
    })

    it(`Tokenizes nested parens`, () => {
      let text = '(a + (b))'
      let {tokens} = grammar.tokenizeLine(text)
      let expected = [
        ['(', scope(['punctuation.section.parens.begin.bracket.round.stan'])],
        ['a', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        ['+', scope(['keyword.operator.arithmetic.stan'])],
        [' ', scope([])],
        ['(', scope(['punctuation.section.parens.begin.bracket.round.stan'])],
        ['b', scope(['meta.identifier.variable.stan'])],
        [')', scope(['punctuation.section.parens.end.bracket.round.stan'])],
        [')', scope(['punctuation.section.parens.end.bracket.round.stan'])]
      ]
      for (let i = 0; i < tokens.length; i++) {
        expect(tokens[i]).toEqual({
          value: expected[i][0],
          scopes: expected[i][1]
        })
      }
    })
  })

  // describe('Array expression', () => {
  //   let text = 'a = {1, a};'
  //   it(`Tokenizes "${text}"`, () => {
  //     let {tokens} = grammar.tokenizeLine(text)
  //     let expected = [
  //       ['{', scope(['punctuation.section.array.begin.bracket.curly.stan'])],
  //       ['1', scope(['constant.numeric.integer.stan'])],
  //       [',', scope(['punctuation.delimiter.comma.stan'])],
  //       [' ', scope([])],
  //       ['a', scope(['meta.identifier.variable.stan'])],
  //       ['}', scope(['punctuation.section.array.end.bracket.curly.stan'])]
  //     ]
  //     for (let i = 0; i < tokens.length; i++) {
  //       expect(tokens[i]).toEqual({
  //         value: expected[i][0],
  //         scopes: expected[i][1]
  //       })
  //     }
  //   })
  // })

  describe('Number literals', function () {
    it('tokenizes integer literals', function () {
      let tokens
      const numbers = ['1234', '1', '0', '02']
      for (var num of numbers) {
        ({tokens} = grammar.tokenizeLine(num))
        expect(tokens[0]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.integer.stan']
        })
      }
    })

    return it('it tokenizes Real literals', function () {
      let tokens
      const numbers = [
        '0.0',
        '1.0',
        '3.14',
        '217.9387',
        '0.123',
        '.123',
        '1.',
        '12e34',
        '12E34',
        '12.e34',
        '12.E34',
        '.1e34',
        '.1E34',
        '12.0e34',
        '12.0E34',
        '12e+34',
        '12E+34',
        '12.e+34',
        '12.E+34',
        '.1e+34',
        '.1E+34',
        '12.0e-34',
        '12.0E-34',
        '12e-34',
        '12E-34',
        '12.e-34',
        '12.E-34',
        '.1e-34',
        '.1E-34',
        '12.0e-34',
        '12.0E-34'
      ]
      for (var num of numbers) {
        ({tokens} = grammar.tokenizeLine(num))
        expect(tokens[0]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.real.stan']
        })
      }
    })
  })

  describe('Function calls', () => {
    const tests = {
      'foo()': [
        ['foo', scope(['meta.function-call.stan', 'meta.identifier.function.stan'])],
        ['(', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        [')', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])]
      ],
      'foo(a)': [
        ['foo', scope(['meta.function-call.stan', 'meta.identifier.function.stan'])],
        ['(', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        ['a', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])]
      ],
      'foo(a, b)': [
        ['foo', scope(['meta.function-call.stan', 'meta.identifier.function.stan'])],
        ['(', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        ['a', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [',', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.function-call.stan', 'meta.arguments.stan'])],
        ['b', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])]
      ],
      'foo((a + b), c)': [
        ['foo', scope(['meta.function-call.stan', 'meta.identifier.function.stan'])],
        ['(', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        ['(', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.section.parens.begin.bracket.round.stan'])],
        ['a', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [' ', scope(['meta.function-call.stan', 'meta.arguments.stan'])],
        ['+', scope(['meta.function-call.stan', 'meta.arguments.stan', 'keyword.operator.arithmetic.stan'])],
        [' ', scope(['meta.function-call.stan', 'meta.arguments.stan'])],
        ['b', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.section.parens.end.bracket.round.stan'])],
        [',', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.function-call.stan', 'meta.arguments.stan'])],
        ['c', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])]
      ],
      'foo(a | b)': [
        ['foo', scope(['meta.function-call.stan', 'meta.identifier.function.stan'])],
        ['(', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        ['a', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [' ', scope(['meta.function-call.stan', 'meta.arguments.stan'])],
        ['|', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.delimiter.bar.stan'])],
        [' ', scope(['meta.function-call.stan', 'meta.arguments.stan'])],
        ['b', scope(['meta.function-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.function-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('Assignment Operators', () => {
    let operators = [
      '<-', '=', '+=', '-=', '*=', '/=', '.*=', './='
    ]
    for (let op of operators) {
      let text = `a ${op} 1;`
      it(`tokenizes operator in "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = [
          ['a', scope(['meta.identifier.variable.stan'])],
          [' ', scope([])],
          [op, scope(['keyword.operator.assignment.stan'])],
          [' ', scope([])],
          ['1', scope(['constant.numeric.integer.stan'])],
          [';', scope(['punctuation.terminator.statement.stan'])]
        ]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('Sampling statements', () => {
    const tests = {
      'y ~ foo();': [
        ['y', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        ['~', scope(['meta.sampling.statement.stan', 'keyword.operator.sampling.stan'])],
        [' ', scope(['meta.sampling.statement.stan'])],
        ['foo', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.identifier.distribution.stan'])],
        ['(', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        [')', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])],
        [';', scope(['meta.sampling.statement.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'y ~ foo(1., a);': [
        ['y', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        ['~', scope(['meta.sampling.statement.stan', 'keyword.operator.sampling.stan'])],
        [' ', scope(['meta.sampling.statement.stan'])],
        ['foo', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.identifier.distribution.stan'])],
        ['(', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        ['1.', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'constant.numeric.real.stan'])],
        [',', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan'])],
        ['a', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])],
        [';', scope(['meta.sampling.statement.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'y ~ foo() T[0., a];': [
        ['y', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        ['~', scope(['meta.sampling.statement.stan', 'keyword.operator.sampling.stan'])],
        [' ', scope(['meta.sampling.statement.stan'])],
        ['foo', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.identifier.distribution.stan'])],
        ['(', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.begin.bracket.round.stan'])],
        [')', scope(['meta.sampling.statement.stan', 'meta.distribution-call.stan', 'meta.arguments.stan', 'punctuation.definition.arguments.end.bracket.round.stan'])],
        [' ', scope(['meta.sampling.statement.stan'])],
        ['T', scope(['meta.sampling.statement.stan', 'keyword.other.truncation.stan'])],
        ['[', scope(['meta.sampling.statement.stan', 'punctuation.defintion.begin.truncation.backets.square.stan'])],
        ['0.', scope(['meta.sampling.statement.stan', 'constant.numeric.real.stan'])],
        [',', scope(['meta.sampling.statement.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.sampling.statement.stan'])],
        ['a', scope(['meta.sampling.statement.stan', 'meta.identifier.variable.stan'])],
        [']', scope(['meta.sampling.statement.stan', 'punctuation.defintion.end.truncation.backets.square.stan'])],
        [';', scope(['meta.sampling.statement.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'T + a': [
        ['T', scope(['meta.identifier.variable.stan'])],
        [' ', scope([])],
        ['+', scope(['keyword.operator.arithmetic.stan'])],
        [' ', scope([])],
        ['a', scope(['meta.identifier.variable.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('Control Keywords', () => {
    let keywords = [
      'for', 'if', 'else', 'while', 'break', 'continue'
    ]
    for (let kw of keywords) {
      let text = `${kw}`
      it(`tokenizes operator in "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = [
          [kw, scope(['keyword.control.stan'])]
        ]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('For loop', () => {
    const tests = {
      'for (i in 1:10)': [
        ['for', scope(['meta.for.statement.stan', 'keyword.control.stan'])],
        [' ', scope(['meta.for.statement.stan'])],
        ['(', scope(['meta.for.statement.stan', 'punctuation.definition.for.begin.round.bracket.stan'])],
        ['i', scope(['meta.for.statement.stan', 'entity.name.variable.for.stan'])],
        [' ', scope(['meta.for.statement.stan'])],
        ['in', scope(['meta.for.statement.stan', 'keyword.control.stan'])],
        [' ', scope(['meta.for.statement.stan'])],
        ['1', scope(['meta.for.statement.stan', 'constant.numeric.integer.stan'])],
        [':', scope(['meta.for.statement.stan', 'keyword.operator.colon.stan'])],
        ['10', scope(['meta.for.statement.stan', 'constant.numeric.integer.stan'])],
        [')', scope(['meta.for.statement.stan', 'punctuation.definition.for.end.round.bracket.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('While loop', () => {
    const tests = {
      'while (1)': [
        ['while', scope(['meta.while.statement.stan', 'keyword.control.stan'])],
        [' ', scope(['meta.while.statement.stan'])],
        ['(', scope(['meta.while.statement.stan', 'punctuation.definition.while.begin.round.bracket.stan'])],
        ['1', scope(['meta.while.statement.stan', 'constant.numeric.integer.stan'])],
        [')', scope(['meta.while.statement.stan', 'punctuation.definition.while.end.round.bracket.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('if condition', () => {
    const tests = {
      'if (1)': [
        ['if', scope(['meta.if.statement.stan', 'keyword.control.stan'])],
        [' ', scope(['meta.if.statement.stan'])],
        ['(', scope(['meta.if.statement.stan', 'punctuation.definition.if.begin.round.bracket.stan'])],
        ['1', scope(['meta.if.statement.stan', 'constant.numeric.integer.stan'])],
        [')', scope(['meta.if.statement.stan', 'punctuation.definition.if.end.round.bracket.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('target statement', () => {
    const tests = {
      'target += 1.0;': [
        ['target +=', scope(['keyword.other.target.stan'])],
        [' ', scope([])],
        ['1.0', scope(['constant.numeric.real.stan'])],
        [';', scope(['punctuation.terminator.statement.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })

  describe('print statements', () => {
    const tests = {
      'print("a b c", a);': [
        ['print', scope(['keyword.other.print.stan'])],
        ['(', scope(['meta.section.print-arguments.stan', 'punctuation.definition.print-arguments.begin.round.bracket.stan'])],
        ['"', scope(['meta.section.print-arguments.stan', 'string.quoted.double.stan', 'punctuation.definition.string.begin.stan'])],
        ['a b c', scope(['meta.section.print-arguments.stan', 'string.quoted.double.stan'])],
        ['"', scope(['meta.section.print-arguments.stan', 'string.quoted.double.stan', 'punctuation.definition.string.end.stan'])],
        [',', scope(['meta.section.print-arguments.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.section.print-arguments.stan'])],
        ['a', scope(['meta.section.print-arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.section.print-arguments.stan', 'punctuation.definition.print-arguments.end.round.bracket.stan'])],
        [';', scope(['punctuation.terminator.statement.stan'])]
      ],
      'reject("a b c", a);': [
        ['reject', scope(['keyword.other.reject.stan'])],
        ['(', scope(['meta.section.print-arguments.stan', 'punctuation.definition.print-arguments.begin.round.bracket.stan'])],
        ['"', scope(['meta.section.print-arguments.stan', 'string.quoted.double.stan', 'punctuation.definition.string.begin.stan'])],
        ['a b c', scope(['meta.section.print-arguments.stan', 'string.quoted.double.stan'])],
        ['"', scope(['meta.section.print-arguments.stan', 'string.quoted.double.stan', 'punctuation.definition.string.end.stan'])],
        [',', scope(['meta.section.print-arguments.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.section.print-arguments.stan'])],
        ['a', scope(['meta.section.print-arguments.stan', 'meta.identifier.variable.stan'])],
        [')', scope(['meta.section.print-arguments.stan', 'punctuation.definition.print-arguments.end.round.bracket.stan'])],
        [';', scope(['punctuation.terminator.statement.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })
  describe('blocks', () => {
    const blocks = [
      'functions',
      'data',
      'transformed data',
      'parameters',
      'transformed parameters',
      'model',
      'generated quantities'
    ]
    for (let blk of blocks) {
      it(`Tokenizes ${blk} block`, () => {
        let text = `${blk}{}`
        let blknm = blk.replace(' ', '-')
        let scopeName = 'meta.section.' + blknm + '.stan'
        let {tokens} = grammar.tokenizeLine(text)
        expect(tokens[0]).toEqual({
          value: blk,
          scopes: scope([scopeName, `entity.name.section.${blknm}.stan`])
        })
        expect(tokens[1]).toEqual({
          value: '{',
          scopes: scope([scopeName, `punctuation.definition.${blknm}.begin.bracket.curly.stan`])
        })
        expect(tokens[2]).toEqual({
          value: '}',
          scopes: scope([scopeName, `punctuation.definition.${blknm}.end.bracket.curly.stan`])
        })
      })
    }
  })
  describe('variable declarations', () => {
    const tests = {
      'real a;': [
        ['real', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'int a;': [
        ['int', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'vector[1] a;': [
        ['vector', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'row_vector[1] a;': [
        ['row_vector', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'unit_vector[1] a;': [
        ['unit_vector', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'simplex[1] a;': [
        ['simplex', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'ordered[1] a;': [
        ['ordered', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'matrix[1, 1] a;': [
        ['matrix', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [',', scope(['meta.variable.declaration.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'cov_matrix[1] a;': [
        ['cov_matrix', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'corr_matrix[1] a;': [
        ['corr_matrix', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'cholesky_factor_corr[1] a;': [
        ['cholesky_factor_corr', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'cholesky_factor_cov[1, 1] a;': [
        ['cholesky_factor_cov', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [',', scope(['meta.variable.declaration.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'real<lower=0.0> a;': [
        ['real', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['<', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.begin.angle.bracket.stan'])],
        ['lower', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'keyword.other.range.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.delimiter.equals.stan'])],
        ['0.0', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'constant.numeric.real.stan'])],
        ['>', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.end.angle.bracket.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'real<upper=1.0> a;': [
        ['real', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['<', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.begin.angle.bracket.stan'])],
        ['upper', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'keyword.other.range.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.delimiter.equals.stan'])],
        ['1.0', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'constant.numeric.real.stan'])],
        ['>', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.end.angle.bracket.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'real<lower=0.0, upper=1.0> a;': [
        ['real', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['<', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.begin.angle.bracket.stan'])],
        ['lower', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'keyword.other.range.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.delimiter.equals.stan'])],
        ['0.0', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'constant.numeric.real.stan'])],
        [',', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan'])],
        ['upper', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'keyword.other.range.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.delimiter.equals.stan'])],
        ['1.0', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'constant.numeric.real.stan'])],
        ['>', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.end.angle.bracket.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'real a = 1.0;': [
        ['real', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan', 'keyword.assignment.stan'])],
        [' ', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan'])],
        ['1.0', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan', 'constant.numeric.real.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ],
      'real<lower=0.> a[1] = a + 1.;': [
        ['real', scope(['meta.variable.declaration.stan', 'storage.type.variable.stan'])],
        ['<', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.begin.angle.bracket.stan'])],
        ['lower', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'keyword.other.range.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.delimiter.equals.stan'])],
        ['0.', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'constant.numeric.real.stan'])],
        ['>', scope(['meta.variable.declaration.stan', 'meta.range-constraints.stan', 'punctuation.definition.range-constraints.end.angle.bracket.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'entity.name.variable.stan'])],
        ['[', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.begin.bracket.square.stan'])],
        ['1', scope(['meta.variable.declaration.stan', 'constant.numeric.integer.stan'])],
        [']', scope(['meta.variable.declaration.stan', 'punctuation.section.brackets.end.bracket.square.stan'])],
        [' ', scope(['meta.variable.declaration.stan'])],
        ['=', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan', 'keyword.assignment.stan'])],
        [' ', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan'])],
        ['a', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan', 'meta.identifier.variable.stan'])],
        [' ', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan'])],
        ['+', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan', 'keyword.operator.arithmetic.stan'])],
        [' ', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan'])],
        ['1.', scope(['meta.variable.declaration.stan', 'meta.section.assignment-rhs.stan', 'constant.numeric.real.stan'])],
        [';', scope(['meta.variable.declaration.stan', 'punctuation.terminator.statement.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })
  describe('variable declarations', () => {
    const tests = {
      'void foo()': [
        ['void', scope(['meta.function-declaration.stan', 'storage.type.return.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['foo', scope(['meta.function-declaration.stan', 'entity.name.function.stan'])],
        ['(', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.begin.bracket.round.stan'])],
        [')', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.end.bracket.round.stan'])]
      ],
      'real[] foo(real a, int b, vector c, row_vector d, matrix f)': [
        ['real[]', scope(['meta.function-declaration.stan', 'storage.type.return.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['foo', scope(['meta.function-declaration.stan', 'entity.name.function.stan'])],
        ['(', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.begin.bracket.round.stan'])],
        ['real', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['a', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [',', scope(['meta.function-declaration.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['int', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['b', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [',', scope(['meta.function-declaration.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['vector', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['c', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [',', scope(['meta.function-declaration.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['row_vector', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['d', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [',', scope(['meta.function-declaration.stan', 'punctuation.delimiter.comma.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['matrix', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['f', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [')', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.end.bracket.round.stan'])]
      ],
      'real[] foo(data real a)': [
        ['real[]', scope(['meta.function-declaration.stan', 'storage.type.return.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['foo', scope(['meta.function-declaration.stan', 'entity.name.function.stan'])],
        ['(', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.begin.bracket.round.stan'])],
        ['data', scope(['meta.function-declaration.stan', 'storage.modifier.data.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['real', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['a', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [')', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.end.bracket.round.stan'])]
      ],
      'real[, ] foo(real[, ,] a)': [
        ['real[, ]', scope(['meta.function-declaration.stan', 'storage.type.return.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['foo', scope(['meta.function-declaration.stan', 'entity.name.function.stan'])],
        ['(', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.begin.bracket.round.stan'])],
        ['real[, ,]', scope(['meta.function-declaration.stan', 'storage.type.function-param.stan'])],
        [' ', scope(['meta.function-declaration.stan'])],
        ['a', scope(['meta.function-declaration.stan', 'variable.parameter.function.stan'])],
        [')', scope(['meta.function-declaration.stan', 'punctuation.definition.function-params.end.bracket.round.stan'])]
      ]
    }
    for (let text in tests) {
      it(`Tokenizes "${text}"`, () => {
        let {tokens} = grammar.tokenizeLine(text)
        let expected = tests[text]
        for (let i = 0; i < tokens.length; i++) {
          expect(tokens[i]).toEqual({
            value: expected[i][0],
            scopes: expected[i][1]
          })
        }
      })
    }
  })
})
