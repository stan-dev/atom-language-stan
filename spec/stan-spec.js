describe("Stan grammar", function() {

  beforeEach(function() {
    waitsForPromise(() => atom.packages.activatePackage("language-stan"));
    runs(() => grammar = atom.grammars.grammarForScopeName("source.stan"));
  });

  it("parses the grammar", function() {
    expect(grammar).toBeTruthy();
    expect(grammar.scopeName).toBe("source.stan");
  });

  describe("comments", function() {
    it("tokenizes // comments", function() {
      const {tokens} = grammar.tokenizeLine('// comment');
      expect(tokens[0]).toEqual({
        value: '//',
        scopes: ['source.stan', 'comment.line.double-slash.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[1]).toEqual({
        value: ' comment',
        scopes: ['source.stan', 'comment.line.double-slash.stan']
      });
    });

    it("tokenizes number comments", function() {
      const {tokens} = grammar.tokenizeLine('# comment');
      expect(tokens[0]).toEqual({
        value: '#',
        scopes: ['source.stan', 'comment.line.number-sign.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[1]).toEqual({
        value: ' comment',
        scopes: ['source.stan', 'comment.line.number-sign.stan']
      });
    });

    it("tokenizes /* */ comments", function() {
      let {tokens} = grammar.tokenizeLine('/**/');
      expect(tokens[0]).toEqual({
        value: '/*',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[1]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      });

      ({tokens} = grammar.tokenizeLine('/* foo */'));
      expect(tokens[0]).toEqual({
        value: '/*',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[1]).toEqual({
        value: ' foo ',
        scopes: ['source.stan', 'comment.block.stan']
      });
      expect(tokens[2]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      });
    });

    it("tokenizes /** */ comments", function() {
      let {tokens} = grammar.tokenizeLine('/***/');
      expect(tokens[0]).toEqual({
        value: '/**',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[1]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });

      ({tokens} = grammar.tokenizeLine('/** foo */'));
      expect(tokens[0]).toEqual({
        value: '/**',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[1]).toEqual({
        value: ' foo ',
        scopes: ['source.stan', 'comment.block.documentation.stan']
      });
      expect(tokens[2]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });

      ({tokens} = grammar.tokenizeLine('/** @param */'));
      expect(tokens[0]).toEqual({
        value: '/**',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });
      expect(tokens[2]).toEqual({
        value: '@param',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'storage.type.class.standoc']
      });
      expect(tokens[3]).toEqual({
        value: ' ',
        scopes: ['source.stan', 'comment.block.documentation.stan']
      });
      expect(tokens[4]).toEqual({
        value: '*/',
        scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      });
    });
  });

  describe("strings", function() {
    it("tokenizes them", function() {
      const {tokens} = grammar.tokenizeLine('"a+12 /"');
      expect(tokens[0]).toEqual({
        value: '"',
        scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.begin.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'a+12 /',
        scopes: ['source.stan', 'string.quoted.double.stan']
      });
      expect(tokens[2]).toEqual({
        value: '"',
        scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.end.stan']
      });
    });

    it("flags bad characters in strings", function() {
      const {tokens} = grammar.tokenizeLine('"a\t"');
      expect(tokens[0]).toEqual({
        value: '"',
        scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.begin.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'a',
        scopes: ['source.stan', 'string.quoted.double.stan']
      });
      expect(tokens[2]).toEqual({
        value: '\t',
        scopes: ['source.stan', 'string.quoted.double.stan', 'invalid.illegal.string.stan']
      });
      expect(tokens[3]).toEqual({
        value: '"',
        scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.end.stan']
      });
    });
  });

  describe("numbers", function() {
    it("tokenizes integers", function() {
      let tokens;
      const numbers = ['1234', '1', '0', '02'];
      for (var num of numbers) {
        ({tokens} = grammar.tokenizeLine(num));
        expect(tokens[0]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.integer.stan']
        });
      }
      for (num of numbers) {
        ({tokens} = grammar.tokenizeLine(`-${num}`));
        expect(tokens[0]).toEqual({
          value: '-',
          scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        });
        expect(tokens[1]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.integer.stan']
        });
      }
      for (num of numbers) {
        ({tokens} = grammar.tokenizeLine(`+${num}`));
        expect(tokens[0]).toEqual({
          value: '+',
          scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        });
        expect(tokens[1]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.integer.stan']
        });
      }
    });

    return it("tokenizes reals", function() {
      let tokens;
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
        '12.0e+34',
        '12.0E+34'
      ];
      for (var num of numbers) {
        ({tokens} = grammar.tokenizeLine(num));
        expect(tokens[0]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.real.stan']
        });
      }
      for (num of numbers) {
        ({tokens} = grammar.tokenizeLine(`-${num}`));
        expect(tokens[0]).toEqual({
          value: '-',
          scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        });
        expect(tokens[1]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.real.stan']
        });
      }
      for (num of numbers) {
        ({tokens} = grammar.tokenizeLine(`+${num}`));
        expect(tokens[0]).toEqual({
          value: '+',
          scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        });
        expect(tokens[1]).toEqual({
          value: num,
          scopes: ['source.stan', 'constant.numeric.real.stan']
        });
      }
    });
  });

  describe("operators", function() {
    describe("logical", function() {
      const operators = ["&&", "||", "!"];

      it("tokenizes them", () => {
        for (let operator of operators) {
          const {tokens} = grammar.tokenizeLine(`a ${operator} b`);
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
          expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[2]).toEqual({
            value: operator,
            scopes: ['source.stan', 'keyword.operator.logical.stan']
          });
          expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[4]).toEqual({
            value: 'b',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
        }
      });
    });

    describe("comparison", function() {
      const operators = [
        "==",
        "!=",
        "<",
        "<=",
        ">",
        ">="
      ];

      it("tokenizes them", () => {
        for (let operator of operators) {
          const {tokens} = grammar.tokenizeLine(`a ${operator} b`);
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
          expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[2]).toEqual({
            value: operator,
            scopes: ['source.stan', 'keyword.operator.comparison.stan']
          });
          expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[4]).toEqual({
            value: 'b',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
        }
      });
    });

    describe("arithmetic", function() {
      const operators = [
        "+",
        "-",
        ".*",
        "*",
        "./",
        "/",
        "%",
        "\\",
        "^"
      ];

      it("tokenizes them", () => {
        for (let operator of operators) {
          const {tokens} = grammar.tokenizeLine(`a ${operator} b`);
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
          expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[2]).toEqual({
            value: operator,
            scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
          });
          expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[4]).toEqual({
            value: 'b',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
        }
      });
    });

    describe("assignment operators", function() {

      it("tokenizes <- as deprecated", function() {
        const {tokens} = grammar.tokenizeLine('a <- b');
        expect(tokens[0]).toEqual({
          value: 'a',
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
        expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[2]).toEqual({
          value: '<-',
          scopes: ['source.stan', 'invalid.deprecated.assignment.stan']
        });
        expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[4]).toEqual({
          value: 'b',
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
      });

      let operators = [
        '+=',
        '-=',
        '/=',
        '*=',
        '.*=',
        './=',
        '='
      ]
      for (let op of operators) {
        it(`tokenizes ${op} as an assignment operator`, function() {
          const {tokens} = grammar.tokenizeLine(`a ${op} b`);
          expect(tokens[0]).toEqual({
            value: 'a',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
          expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[2]).toEqual({
            value: `${op}`,
            scopes: ['source.stan', 'keyword.operator.assignment.stan']
          });
          expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
          expect(tokens[4]).toEqual({
            value: 'b',
            scopes: ['source.stan', 'variable.other.identifier.stan']
          });
        });
      }
    });

    describe("colon", () => it("tokenizes it", function() {
      const {tokens} = grammar.tokenizeLine('a:b');
      expect(tokens[0]).toEqual({
        value: 'a',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
      expect(tokens[1]).toEqual({
        value: ':',
        scopes: ['source.stan', 'keyword.operator.colon.stan']
      });
      expect(tokens[2]).toEqual({
        value: 'b',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
    }));

    describe("colon", () => it("tokenizes it", function() {
      const {tokens} = grammar.tokenizeLine('a ? b : c');
      expect(tokens[0]).toEqual({
        value: 'a',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
      expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
      expect(tokens[2]).toEqual({
        value: '?',
        scopes: ['source.stan', 'keyword.operator.ternary.stan']
      });
      expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
      expect(tokens[4]).toEqual({
        value: 'b',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
      expect(tokens[5]).toEqual({value: ' ', scopes: ['source.stan']});
      expect(tokens[6]).toEqual({
        value: ':',
        scopes: ['source.stan', 'keyword.operator.ternary.stan']
      });
      expect(tokens[7]).toEqual({value: ' ', scopes: ['source.stan']});
      expect(tokens[8]).toEqual({
        value: 'c',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
    }));
  });

  describe("block declarations", function() {
    const blocks = [
      "functions",
      "data",
      "transformed data",
      "parameters",
      "transformed data",
      "model",
      "generated quantities"
    ];
    it("tokenizes them", () => {
      for (let block of blocks) {
        const line = block + '{' + '}';
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: block,
          scopes: ['source.stan', 'meta.block.stan', 'entity.name.section.stan']
        });
        expect(tokens[1]).toEqual({
          value: '{',
          scopes: ['source.stan', 'meta.block.stan', 'punctuation.section.block.begin.bracket.curly.stan']
        });
        expect(tokens[2]).toEqual({
          value: '}',
          scopes: ['source.stan', 'meta.block.stan', 'punctuation.section.block.end.bracket.curly.stan']
        });
      }
    });
  });

  describe("variable declarations", () => {
    it("tokenizes real variable declaration", () => {
      const line = "real a;";
      const {tokens} = grammar.tokenizeLine(line);
      const expected = [
        ['real', ['source.stan', 'meta.variable.stan', 'storage.type.variable.stan']],
        [' ', ['source.stan', 'meta.variable.stan']],
        ['a', ['source.stan', 'meta.variable.stan', 'entity.name.variable.stan']],
        [';', ['source.stan', 'punctuation.terminator.statement.stan']]
      ];
      for (let i = 0; i < expected.length; i++) {
        expect(tokens[i]).toEqual({
          'value': expected[i][0],
          'scopes': expected[i][1]
        });
      }
    });
  });

  describe("variable declarations with lower and upper bounds", () => {
    it("tokenizes real variable declaration", () => {
      const line = "real<lower=0., upper=0.> a;";
      const {tokens} = grammar.tokenizeLine(line);
      const expected = [
        ['real', ['source.stan', 'meta.variable.stan', 'storage.type.variable.stan']],
        ['<', ['source.stan', 'meta.variable.stan']],
        ['lower', ['source.stan', 'meta.variable.stan']],
        ['=', ['source.stan', 'meta.variable.stan']],
        ['0.', ['source.stan', 'meta.variable.stan']],
        [',', ['source.stan', 'meta.variable.stan']],
        ['upper', ['source.stan', 'meta.variable.stan']],
        ['=', ['source.stan', 'meta.variable.stan']],
        ['0.', ['source.stan', 'meta.variable.stan']],
        ['>', ['source.stan', 'meta.variable.stan']],
        ['a', ['source.stan', 'meta.variable.stan', 'entity.name.variable.stan']],
        [' ', ['source.stan', 'meta.variable.stan']],
        [';', ['source.stan', 'punctuation.terminator.statement.stan']]
      ];
      for (let i = 0; i < expected.length; i++) {
        expect(tokens[i]).toEqual({
          'value': expected[i][0],
          'scopes': expected[i][1]
        });
      }
    });

    describe("variable declarations with array dimensions", () => {
      it("tokenizes real variable declaration", () => {
        const line = "real a[1];";
        const {tokens} = grammar.tokenizeLine(line);
        const expected = [
          ['real', ['source.stan', 'meta.variable.stan', 'storage.type.variable.stan']],
          [' ', ['source.stan', 'meta.variable.stan']],
          ['a', ['source.stan', 'meta.variable.stan', 'entity.name.variable.stan']],
          ['[', ['source.stan', 'meta.variable.stan']],
          ['1', ['source.stan', 'meta.variable.stan']],
          [']', ['source.stan', 'meta.variable.stan']],
          [';', ['source.stan', 'punctuation.terminator.statement.stan']]
        ];
        for (let i = 0; i < expected.length; i++) {
          expect(tokens[i]).toEqual({
            'value': expected[i][0],
            'scopes': expected[i][1]
          });
        }
      });
  });

  describe("control keywords", () => {
    it("tokenizes them", function() {
      const keywords = [
        'for',
        'in',
        'while',
        'if',
        'else',
        'break',
        'continue'
      ];
      for (let kw of keywords) {
        const {tokens} = grammar.tokenizeLine(kw);
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'keyword.control.stan']
        });
      }
    });
  });

  describe("range constraints", function() {
    const bounds = ['lower', 'upper'];
    it("tokenizes them", () => {
      for (let kw of bounds) {
        const {tokens} = grammar.tokenizeLine(kw + ' =');
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'keyword.other.range.stan']
        });
        expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[2]).toEqual({
          value: '=',
          scopes: ['source.stan', 'punctuation.operator.equal.stan']
        });
      }
    });

    it("does not tokenize them if not followed by a =", () => {
      for (let kw of bounds) {
        const {tokens} = grammar.tokenizeLine(kw);
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
      }
    });

    it("does not tokenize them when not followed by =", () => {
      for (let kw of bounds) {
        const {tokens} = grammar.tokenizeLine(kw);
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
      }
    });
  });

  describe("special functions", function() {
    const keywords = ['print', 'reject'];
    it("tokenizes them", () => {
      for (let kw of keywords) {
        const {tokens} = grammar.tokenizeLine(kw + ' (');
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'keyword.other.special-functions.stan']
        });
      }
    });
  });

  describe("deprecated functions", function() {
    const keywords = [
      'increment_log_prob',
      'integrate_ode',
      'get_lp',
      'binomial_coefficient_log',
      'multiply_log',
      'normal_log',
      'normal_cdf_log',
      'normal_ccdf_log'
    ];
    it("tokenizes them", () => {
      for (let kw of keywords) {
        const {tokens} = grammar.tokenizeLine(kw + ' (');
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'invalid.deprecated.function.stan']
        });
      }
    });
  });

  describe("return statement", () => it("tokenizes it", function() {
    const {tokens} = grammar.tokenizeLine('return');
    expect(tokens[0]).toEqual({
      value: 'return',
      scopes: ['source.stan', 'keyword.other.return.stan']
    });
  }));

  describe("truncation operator", function() {
    it("tokenizes it", function() {
      const {tokens} = grammar.tokenizeLine('T[5]');
      expect(tokens[0]).toEqual({
        value: 'T',
        scopes: ['source.stan', 'keyword.other.truncation.stan']
      });
      expect(tokens[1]).toEqual({
        value: '[',
        scopes: ['source.stan', 'punctuation.section.brackets.begin.bracket.square.stan']
      });
      expect(tokens[2]).toEqual({
        value: '5',
        scopes: ['source.stan', 'constant.numeric.integer.stan']
      });
      expect(tokens[3]).toEqual({
        value: ']',
        scopes: ['source.stan', 'punctuation.section.brackets.end.bracket.square.stan']
      });
    });

    it("does not tokenize variable ending in T", function() {
      const {tokens} = grammar.tokenizeLine('fooT');
      expect(tokens[0]).toEqual({
        value: 'fooT',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
    });
  });

  describe("functions", () => {
    it("tokenizes them", function() {
      // only use a few examples
      const functions = ['Phi', 'Phi_approx', 'abs', 'acos'];
      for (let fxn of functions) {
        const line = fxn;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: fxn,
          scopes: ['source.stan', 'support.function.function.stan']
        });
      }
    });
    it("tokenizes integrate_ode", function() {
      // only use a few examples
      const functions = ['integrate_ode_bdf', 'integrate_ode_rk45'];
      for (let fxn of functions) {
        const line = fxn;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: fxn,
          scopes: ['source.stan', 'support.function.integrate_ode.stan']
        });
      }
    });
    it("tokenizes algegra_solver", function() {
      const {tokens} = grammar.tokenizeLine("algebra_solver");
      expect(tokens[0]).toEqual({
        value: 'algebra_solver',
        scopes: ['source.stan', 'support.function.algebra_solver.stan']
      });
    });
  });

  describe("distributions", function() {
    it("tokenizes them following a ~", function() {
      // only use a few examples
      const distributions = ['normal', 'beta', 'cauchy'];
      const result = [];
      for (let distr of distributions) {
        const line = `~ ${distr}`;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: '~',
          scopes: ['source.stan', 'meta.sampling.stan', 'keyword.operator.sampling.stan']
        });
        expect(tokens[1]).toEqual({
          value: ' ',
          scopes: ['source.stan', 'meta.sampling.stan']
        });
        expect(tokens[2]).toEqual({
          value: distr,
          scopes: ['source.stan', 'meta.sampling.stan', 'support.function.distribution.stan']
        });
      }
    });

    it("tokenizes arbitrary distribution after ~", function() {
      // only use a few examples
      const line = '~ foo';
      const {tokens} = grammar.tokenizeLine(line);
      expect(tokens[0]).toEqual({
        value: '~',
        scopes: ['source.stan', 'meta.sampling.stan', 'keyword.operator.sampling.stan']
      });
      expect(tokens[1]).toEqual({
        value: ' ',
        scopes: ['source.stan', 'meta.sampling.stan']
      });
      expect(tokens[2]).toEqual({
        value: 'foo',
        scopes: ['source.stan', 'meta.sampling.stan', 'variable.other.distribution.stan']
      });
    });

    it("is not confused by distributions starting with the name of another distribution", function() {
      // only use a few examples
      const line = '~ normala';
      const {tokens} = grammar.tokenizeLine(line);
      expect(tokens[0]).toEqual({
        value: '~',
        scopes: ['source.stan', 'meta.sampling.stan', 'keyword.operator.sampling.stan']
      });
      expect(tokens[1]).toEqual({
        value: ' ',
        scopes: ['source.stan', 'meta.sampling.stan']
      });
      expect(tokens[2]).toEqual({
        value: 'normala',
        scopes: ['source.stan', 'meta.sampling.stan', 'variable.other.distribution.stan']
      });
    });

    it("tokenizes them using when target += foo(y | theta)", function() {
      // only use a few examples
      const distributions = ['normal_lpdf', 'beta_lpdf', 'cauchy_lpdf'];
      for (let distr of distributions) {
        const line = `target += ${distr}(a | b, c)`;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: 'target',
          scopes: ['source.stan', 'keyword.other.target.stan']
        });
        expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[2]).toEqual({
          value: '+=',
          scopes: ['source.stan', 'keyword.operator.accumulator.stan']
        });
        expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[4]).toEqual({
          value: distr,
          scopes: ['source.stan', 'support.function.function.stan']
        });
        expect(tokens[5]).toEqual({
          value: '(',
          scopes: ['source.stan', 'punctuation.section.parens.begin.bracket.round.stan']
        });
        expect(tokens[6]).toEqual({
          value: 'a',
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
        expect(tokens[7]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[8]).toEqual({
          value: '|',
          scopes: ['source.stan', 'punctuation.sampling.bar.stan']
        });
        expect(tokens[9]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[10]).toEqual({
          value: 'b',
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
        expect(tokens[11]).toEqual({
          value: ',',
          scopes: ['source.stan', 'meta.delimiter.comma.stan']
        });
        expect(tokens[12]).toEqual({value: ' ', scopes: ['source.stan']});
        expect(tokens[13]).toEqual({
          value: 'c',
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
        expect(tokens[14]).toEqual({
          value: ')',
          scopes: ['source.stan', 'punctuation.section.parens.end.bracket.round.stan']
        });
      }
    });

    it("does not tokenize them not following a ~", function() {
      // only use a few examples
      const distributions = ['normal', 'beta', 'cauchy'];
      for (let distr of distributions) {
        const line = distr;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: distr,
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
      }
    });
  });

  describe("reserved", function() {
    it("tokenizes C++ reserved words", function() {
      const keywords = ['alignas', 'and', 'xor', 'xor_eq'];
      for (let kw of keywords) {
        const line = kw;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'invalid.illegal.reserved.stan']
        });
      }
    });

    return it("tokenizes Stan reserved words", function() {
      const keywords = ['true', 'STAN_MAJOR', 'var', 'fvar'];
      for (let kw of keywords) {
        const line = kw;
        const {tokens} = grammar.tokenizeLine(line);
        expect(tokens[0]).toEqual({
          value: kw,
          scopes: ['source.stan', 'invalid.illegal.reserved.stan']
        });
      }
    });
  });

  describe("variable names", function() {
    it("tokenizes valid variable names", function() {
      const words = [
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_abc',
        'a',
        'a3',
        'Sigma',
        'my_cpp_style_variable',
        'myCamelCaseVariable'
      ];
      for (let w of words) {
        const {tokens} = grammar.tokenizeLine(w);
        expect(tokens[0]).toEqual({
          value: w,
          scopes: ['source.stan', 'variable.other.identifier.stan']
        });
      }
    });

    return it("tokenizes invalid variable names", function() {
      const words = ['a__', '1a', '_a', '_', 'lp__'];
      for (let w of words) {
        const {tokens} = grammar.tokenizeLine(w);
        expect(tokens[0]).toEqual({
          value: w,
          scopes: ['source.stan', 'invalid.illegal.variable']
        });
      }
    });
  });

  describe("braces", function() {
    it("tokenizes curly brackets", function() {
      let {tokens} = grammar.tokenizeLine('{}');
      expect(tokens[0]).toEqual({
        value: '{',
        scopes: ['source.stan', 'punctuation.section.block.begin.bracket.curly.stan']
      });
      expect(tokens[1]).toEqual({
        value: '}',
        scopes: ['source.stan', 'punctuation.section.block.end.bracket.curly.stan']
      });

      ({tokens} = grammar.tokenizeLine('{real a;}'));
      expect(tokens[0]).toEqual({
        value: '{',
        scopes: ['source.stan', 'punctuation.section.block.begin.bracket.curly.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'real',
        scopes: ['source.stan', 'meta.variable.stan', 'storage.type.variable.stan']
      });
      expect(tokens[2]).toEqual({
        value: ' ',
        scopes: ['source.stan', 'meta.variable.stan']
      });
      expect(tokens[3]).toEqual({
        value: 'a',
        scopes: ['source.stan', 'meta.variable.stan', 'entity.name.variable.stan']
      });
      expect(tokens[4]).toEqual({
        value: ';',
        scopes: ['source.stan', 'punctuation.terminator.statement.stan']
      });
      expect(tokens[5]).toEqual({
        value: '}',
        scopes: ['source.stan', 'punctuation.section.block.end.bracket.curly.stan']
      });

      const lines = grammar.tokenizeLines(`{
  real a;
}\
`);
      expect(lines[0][0]).toEqual({
        value: '{',
        scopes: ['source.stan', 'punctuation.section.block.begin.bracket.curly.stan']
      });
      expect(lines[1][1]).toEqual({
        value: 'real',
        scopes: ['source.stan', 'meta.variable.stan', 'storage.type.variable.stan']
      });
      expect(lines[1][2]).toEqual({value: ' ', scopes: ['source.stan', 'meta.variable.stan']});
      expect(lines[1][3]).toEqual({
        value: 'a',
        scopes: ['source.stan', 'meta.variable.stan', 'entity.name.variable.stan']
      });
      expect(lines[1][4]).toEqual({
        value: ';',
        scopes: ['source.stan', 'punctuation.terminator.statement.stan']
      });
      expect(lines[2][0]).toEqual({
        value: '}',
        scopes: ['source.stan', 'punctuation.section.block.end.bracket.curly.stan']
      });
    });

    it("tokenizes square brackets", function() {
      const {tokens} = grammar.tokenizeLine('[]');
      const scope = ['source.stan'];
      expect(tokens[0]).toEqual({
        value: '[',
        scopes: scope.concat(['punctuation.section.brackets.begin.bracket.square.stan'])
      });
      expect(tokens[1]).toEqual({
        value: ']',
        scopes: scope.concat(['punctuation.section.brackets.end.bracket.square.stan'])
      });
    });

    it("tokenizes round brackets", function() {
      const {tokens} = grammar.tokenizeLine('()');
      const scope = ['source.stan'];
      expect(tokens[0]).toEqual({
        value: '(',
        scopes: scope.concat(['punctuation.section.parens.begin.bracket.round.stan'])
      });
      expect(tokens[1]).toEqual({
        value: ')',
        scopes: scope.concat(['punctuation.section.parens.end.bracket.round.stan'])
      });
    });
  });

  describe("statement terminator", () => {
    it("parses it", function() {
      let {tokens} = grammar.tokenizeLine(';');
      expect(tokens[0]).toEqual({
        value: ';',
        scopes: ['source.stan', 'punctuation.terminator.statement.stan']
      });
      ({tokens} = grammar.tokenizeLine('a = 1;'));
      expect(tokens[0]).toEqual({
        value: 'a',
        scopes: ['source.stan', 'variable.other.identifier.stan']
      });
      expect(tokens[1]).toEqual({value: ' ', scopes: ['source.stan']});
      expect(tokens[2]).toEqual({
        value: '=',
        scopes: ['source.stan', 'keyword.operator.assignment.stan']
      });
      expect(tokens[3]).toEqual({value: ' ', scopes: ['source.stan']});
      expect(tokens[4]).toEqual({
        value: '1',
        scopes: ['source.stan', 'constant.numeric.integer.stan']
      });
      expect(tokens[5]).toEqual({
        value: ';',
        scopes: ['source.stan', 'punctuation.terminator.statement.stan']
      });
    })
  });

  describe("include pre-processor directive", () => {
    it("parses include with no quotes around file", function() {
      const {tokens} = grammar.tokenizeLine('#' + 'include my_includes.txt');
      expect(tokens[0]).toEqual({
        value: '#',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan', 'punctuation.definition.directive.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'include',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan']
      });
      expect(tokens[3]).toEqual({
        value: 'my_includes.txt',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.other.noquote.include.stan']
      });
    });
    it("parses include with double quotes around file", function() {
      const {tokens} = grammar.tokenizeLine('#' + 'include "my_includes.txt"');
      expect(tokens[0]).toEqual({
        value: '#',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan', 'punctuation.definition.directive.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'include',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan']
      });
      expect(tokens[3]).toEqual({
        value: '"',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.double.include.stan', 'punctuation.definition.string.begin.stan']
      });
      expect(tokens[4]).toEqual({
        value: 'my_includes.txt',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.double.include.stan']
      });
      expect(tokens[5]).toEqual({
        value: '"',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.double.include.stan', 'punctuation.definition.string.end.stan']
      });
    });
    it("parses include with <> around file", function() {
      const {tokens} = grammar.tokenizeLine('#' + 'include <my_includes.txt>');
      expect(tokens[0]).toEqual({
        value: '#',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan', 'punctuation.definition.directive.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'include',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan']
      });
      expect(tokens[3]).toEqual({
        value: '<',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.other.lt-gt.include.stan', 'punctuation.definition.string.begin.stan']
      });
      expect(tokens[4]).toEqual({
        value: 'my_includes.txt',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.other.lt-gt.include.stan']
      });
      expect(tokens[5]).toEqual({
        value: '>',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.other.lt-gt.include.stan', 'punctuation.definition.string.end.stan']
      });
    });
    it("parses include with single quotes around file", function() {
      const {tokens} = grammar.tokenizeLine('#' + 'include \'my_includes.txt\'');
      expect(tokens[0]).toEqual({
        value: '#',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan', 'punctuation.definition.directive.stan']
      });
      expect(tokens[1]).toEqual({
        value: 'include',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'keyword.control.directive.include.stan']
      });
      expect(tokens[3]).toEqual({
        value: '\'',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.single.include.stan', 'punctuation.definition.string.begin.stan']
      });
      expect(tokens[4]).toEqual({
        value: 'my_includes.txt',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.single.include.stan']
      });
      expect(tokens[5]).toEqual({
        value: '\'',
        scopes: ['source.stan', 'meta.preprocessor.include.stan', 'string.quoted.single.include.stan', 'punctuation.definition.string.end.stan']
      });
    });
  });

  describe("function declarations", () => {
    it("parses empty functions", () => {
      const return_types = [
        'void',
        'int',
        'real',
        'vector',
        'row_vector',
        'matrix'
      ]
      for (let i = 0; i < return_types.length; i++) {
        let typ = return_types[i];
        const {tokens} = grammar.tokenizeLine(typ + ' foo()');
        const scopes = ['source.stan', 'meta.function.stan']
        expect(tokens[0]).toEqual({
          value: typ,
          scopes: scopes.concat(['storage.type.stan'])
        });
        expect(tokens[2]).toEqual({
          value: 'foo',
          scopes: scopes.concat(['entity.name.function.stan'])
        });
        expect(tokens[3]).toEqual({
          value: '(',
          scopes: scopes.concat(['punctuation.definition.parameters.begin.bracket.round.stan'])
        })
        expect(tokens[4]).toEqual({
          value: ')',
          scopes: scopes.concat(['punctuation.definition.parameters.end.bracket.round.stan'])
        })
      }
    });
    it("parses function with one argument", () => {
      const {tokens} = grammar.tokenizeLine('real foo(real a)');
      const scopes = ['source.stan', 'meta.function.stan']
      expect(tokens[0]).toEqual({
        value: 'real',
        scopes: scopes.concat(['storage.type.stan'])
      });
      expect(tokens[2]).toEqual({
        value: 'foo',
        scopes: scopes.concat(['entity.name.function.stan'])
      });
      expect(tokens[3]).toEqual({
        value: '(',
        scopes: scopes.concat(['punctuation.definition.parameters.begin.bracket.round.stan'])
      })
      expect(tokens[4]).toEqual({
        value: 'real',
        scopes: scopes.concat(['storage.type.parameter.stan'])
      })
      expect(tokens[6]).toEqual({
        value: 'a',
        scopes: scopes.concat(['variable.parameter.function.stan'])
      })
      expect(tokens[7]).toEqual({
        value: ')',
        scopes: scopes.concat(['punctuation.definition.parameters.end.bracket.round.stan'])
      });
    });
    it("parses function with multiple arguments", () => {
      const {tokens} = grammar.tokenizeLine('real foo(real a, int b, vector c)');
      const scopes = ['source.stan', 'meta.function.stan']
      expect(tokens[0]).toEqual({
        value: 'real',
        scopes: scopes.concat(['storage.type.stan'])
      });
      expect(tokens[2]).toEqual({
        value: 'foo',
        scopes: scopes.concat(['entity.name.function.stan'])
      });
      expect(tokens[3]).toEqual({
        value: '(',
        scopes: scopes.concat(['punctuation.definition.parameters.begin.bracket.round.stan'])
      });
      expect(tokens[4]).toEqual({
        value: 'real',
        scopes: scopes.concat(['storage.type.parameter.stan'])
      });
      expect(tokens[6]).toEqual({
        value: 'a',
        scopes: scopes.concat(['variable.parameter.function.stan'])
      });
      expect(tokens[7]).toEqual({
        value: ',',
        scopes: scopes.concat(['meta.delimiter.comma.stan'])
      });
      expect(tokens[9]).toEqual({
        value: 'int',
        scopes: scopes.concat(['storage.type.parameter.stan'])
      });
      expect(tokens[11]).toEqual({
        value: 'b',
        scopes: scopes.concat(['variable.parameter.function.stan'])
      });
      expect(tokens[12]).toEqual({
        value: ',',
        scopes: scopes.concat(['meta.delimiter.comma.stan'])
      });
      expect(tokens[14]).toEqual({
        value: 'vector',
        scopes: scopes.concat(['storage.type.parameter.stan'])
      });
      expect(tokens[16]).toEqual({
        value: 'c',
        scopes: scopes.concat(['variable.parameter.function.stan'])
      });
      expect(tokens[17]).toEqual({
        value: ')',
        scopes: scopes.concat(['punctuation.definition.parameters.end.bracket.round.stan'])
      });
    });
  });
});
