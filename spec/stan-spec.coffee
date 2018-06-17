fs = require 'fs'
path = require 'path'

describe "Stan grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-stan")

    runs ->
      grammar = atom.grammars.grammarForScopeName("source.stan")

  it "parses the grammar", ->
    expect(grammar).toBeTruthy()
    expect(grammar.scopeName).toBe "source.stan"

  describe "comments", ->
    it "tokenizes // comments", ->
      {tokens} = grammar.tokenizeLine('// comment')
      expect(tokens[0]).toEqual value: '//', scopes: ['source.stan', 'comment.line.double-slash.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: ' comment', scopes: ['source.stan', 'comment.line.double-slash.stan']

    it "tokenizes number comments", ->
      {tokens} = grammar.tokenizeLine('# comment')
      expect(tokens[0]).toEqual value: '#', scopes: ['source.stan', 'comment.line.number-sign.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: ' comment', scopes: ['source.stan', 'comment.line.number-sign.stan']

    it "tokenizes /* */ comments", ->
      {tokens} = grammar.tokenizeLine('/**/')
      expect(tokens[0]).toEqual value: '/*', scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: '*/', scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']

      {tokens} = grammar.tokenizeLine('/* foo */')
      expect(tokens[0]).toEqual value: '/*', scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: ' foo ', scopes: ['source.stan', 'comment.block.stan']
      expect(tokens[2]).toEqual value: '*/', scopes: ['source.stan', 'comment.block.stan', 'punctuation.definition.comment.stan']

    it "tokenizes /** */ comments", ->
      {tokens} = grammar.tokenizeLine('/***/')
      expect(tokens[0]).toEqual value: '/**', scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: '*/', scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']

      {tokens} = grammar.tokenizeLine('/** foo */')
      expect(tokens[0]).toEqual value: '/**', scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: ' foo ', scopes: ['source.stan', 'comment.block.documentation.stan']
      expect(tokens[2]).toEqual value: '*/', scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']

      {tokens} = grammar.tokenizeLine('/** @param */')
      expect(tokens[0]).toEqual value: '/**', scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']
      expect(tokens[2]).toEqual value: '@param', scopes: ['source.stan', 'comment.block.documentation.stan', 'storage.type.class.standoc']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan', 'comment.block.documentation.stan']
      expect(tokens[4]).toEqual value: '*/', scopes: ['source.stan', 'comment.block.documentation.stan', 'punctuation.definition.comment.stan']


  describe "strings", ->
    it "tokenizes them", ->
      {tokens} = grammar.tokenizeLine('"a+12 /"')
      expect(tokens[0]).toEqual value: '"', scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.begin.stan']
      expect(tokens[1]).toEqual value: 'a+12 /', scopes: ['source.stan', 'string.quoted.double.stan']
      expect(tokens[2]).toEqual value: '"', scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.end.stan']

    it "flags bad characters in strings", ->
      {tokens} = grammar.tokenizeLine('"a\t"')
      expect(tokens[0]).toEqual value: '"', scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.begin.stan']
      expect(tokens[1]).toEqual value: 'a', scopes: ['source.stan', 'string.quoted.double.stan']
      expect(tokens[2]).toEqual value: '\t', scopes: ['source.stan', 'string.quoted.double.stan', 'invalid.illegal.string.stan']
      expect(tokens[3]).toEqual value: '"', scopes: ['source.stan', 'string.quoted.double.stan', 'punctuation.definition.string.end.stan']

  describe "numbers", ->
    it "tokenizes integers", ->
      numbers = ['1234', '1', '0', '02']
      for num in numbers
        {tokens} = grammar.tokenizeLine(num)
        expect(tokens[0]).toEqual value: num, scopes: ['source.stan', 'constant.numeric.integer.stan']
      for num in numbers
        {tokens} = grammar.tokenizeLine('-' + num)
        expect(tokens[0]).toEqual value: '-', scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        expect(tokens[1]).toEqual value: num, scopes: ['source.stan', 'constant.numeric.integer.stan']
      for num in numbers
        {tokens} = grammar.tokenizeLine('+' + num)
        expect(tokens[0]).toEqual value: '+', scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        expect(tokens[1]).toEqual value: num, scopes: ['source.stan', 'constant.numeric.integer.stan']

    it "tokenizes reals", ->
      numbers = ['0.0', '1.0', '3.14', '217.9387',
                 '0.123', '.123',  '1.',
                 '12e34', '12E34', '12.e34', '12.E34',
                 '.1e34', '.1E34', '12.0e34', '12.0E34']
      for num in numbers
        {tokens} = grammar.tokenizeLine(num)
        expect(tokens[0]).toEqual value: num, scopes: ['source.stan', 'constant.numeric.real.stan']
      for num in numbers
        {tokens} = grammar.tokenizeLine('-' + num)
        expect(tokens[0]).toEqual value: '-', scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        expect(tokens[1]).toEqual value: num, scopes: ['source.stan', 'constant.numeric.real.stan']
      for num in numbers
        {tokens} = grammar.tokenizeLine('+' + num)
        expect(tokens[0]).toEqual value: '+', scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
        expect(tokens[1]).toEqual value: num, scopes: ['source.stan', 'constant.numeric.real.stan']


  describe "operators", ->
    describe "logical", ->
      operators = ["&&", "||", "!"]

      it "tokenizes them", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
          expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[2]).toEqual value: operator, scopes: ['source.stan', 'keyword.operator.logical.stan']
          expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[4]).toEqual value: 'b', scopes: ['source.stan']

    describe "comparison", ->
      operators = ["==", "!=", "<", "<=", ">", ">="]

      it "tokenizes them", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
          expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[2]).toEqual value: operator, scopes: ['source.stan', 'keyword.operator.comparison.stan']
          expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[4]).toEqual value: 'b', scopes: ['source.stan']

    describe "arithmetic", ->
      operators = ["+", "-", ".*", "*", "./", "/", "%", "\\", "^"]

      it "tokenizes them", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
          expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[2]).toEqual value: operator, scopes: ['source.stan', 'keyword.operator.arithmetic.stan']
          expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[4]).toEqual value: 'b', scopes: ['source.stan']

    describe "assignment", ->
      operators = ['=', '+=', '-=', '*=', "/=", ".*=", "./="]

      it "tokenizes <- as deprecated", ->
        {tokens} = grammar.tokenizeLine('a <- b')
        expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
        expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[2]).toEqual value: '<-', scopes: ['source.stan', 'invalid.deprecated.assignment.stan']
        expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[4]).toEqual value: 'b', scopes: ['source.stan']

      it "tokenizes =", ->
        for operator in operators
          {tokens} = grammar.tokenizeLine('a ' + operator + ' b')
          expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
          expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[2]).toEqual value: operator, scopes: ['source.stan', 'keyword.operator.assignment.stan']
          expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
          expect(tokens[4]).toEqual value: 'b', scopes: ['source.stan']

    describe "colon", ->
      it "tokenizes it", ->
        {tokens} = grammar.tokenizeLine('a:b')
        expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
        expect(tokens[1]).toEqual value: ':', scopes: ['source.stan', 'keyword.operator.colon.stan']
        expect(tokens[2]).toEqual value: 'b', scopes: ['source.stan']

    describe "colon", ->
      it "tokenizes it", ->
        {tokens} = grammar.tokenizeLine('a ? b : c')
        expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
        expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[2]).toEqual value: '?', scopes: ['source.stan', 'keyword.operator.conditional.stan']
        expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[4]).toEqual value: 'b', scopes: ['source.stan']
        expect(tokens[5]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[6]).toEqual value: ':', scopes: ['source.stan', 'keyword.operator.colon.stan']
        expect(tokens[7]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[8]).toEqual value: 'c', scopes: ['source.stan']

  describe "block declarations", ->
    blocks = ["functions", "data", "transformed data", "parameters",
              "transformed data", "model", "generated quantities"]
    it "tokenizes them", ->
      for block in blocks
        line = block + '{'
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: block, scopes: ['source.stan', 'entity.name.type.stan']

  describe "variable types", ->
    types = ["int", "real", "vector", "simplex", "ordered", "positive_ordered",
             "row_vector", "matrix", "corr_matrix", "cov_matrix",
             "cholesky_factor_cov", "cholesky_factor_corr",
             "void"]
    it "tokenizes them", ->
      for typ in types
        line = typ
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: typ, scopes: ['source.stan', 'storage.type.stan']

  describe "control keywords", ->
    it "tokenizes them", ->
      keywords = ['for', 'in', 'while', 'if', 'else']
      for kw in keywords
        {tokens} = grammar.tokenizeLine(kw)
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan', 'keyword.control.stan']

  describe "range constraints", ->
    bounds = ['lower', 'upper']
    it "tokenizes them", ->
      for kw in bounds
        {tokens} = grammar.tokenizeLine(kw + ' =')
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan', 'keyword.other.range.stan']
        expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[2]).toEqual value: '=', scopes: ['source.stan', 'punctuation.operator.equal.stan']
    it "does not tokenize them if not followed by a =", ->
      for kw in bounds
        {tokens} = grammar.tokenizeLine(kw)
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan']


    it "does not tokenize them when not followed by =", ->
      for kw in bounds
        {tokens} = grammar.tokenizeLine(kw)
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan']

  describe "special functions", ->
    it "tokenizes print", ->
        {tokens} = grammar.tokenizeLine('print(')
        expect(tokens[0]).toEqual value: 'print', scopes: ['source.stan', 'keyword.other.print.stan']

    it "tokenizes reject", ->
        {tokens} = grammar.tokenizeLine('reject(')
        expect(tokens[0]).toEqual value: 'reject', scopes: ['source.stan', 'keyword.other.reject.stan']

  describe "inegrate_ode-like functions", ->
    it "tokenizes integrate_ode", ->
        for kw in ['integrate_ode_bdf', 'integrate_ode_rk45']
            {tokens} = grammar.tokenizeLine(kw + '(')
            expect(tokens[0]).toEqual value: kw, scopes: ['source.stan', 'support.function.integrate_ode.stan']

    it "tokenizes algebra_solver", ->
        {tokens} = grammar.tokenizeLine('algebra_solver(')
        expect(tokens[0]).toEqual value: 'algebra_solver', scopes: ['source.stan', 'support.function.algebra_solver.stan']

  describe "deprecated functions", ->
    keywords = ['increment_log_prob', 'integrate_ode', 'get_lp',
                'binomial_coefficient_log', 'multiply_log', 'normal_log',
                'normal_cdf_log', 'normal_ccdf_log']
    it "tokenizes them", ->
      for kw in keywords
        {tokens} = grammar.tokenizeLine(kw + ' (')
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan', 'invalid.deprecated.function.stan']


  describe "return statement", ->
    it "tokenizes it", ->
      {tokens} = grammar.tokenizeLine('return')
      expect(tokens[0]).toEqual value: 'return', scopes: ['source.stan', 'keyword.other.return.stan']

  describe "truncation operator", ->
    it "tokenizes it", ->
      {tokens} = grammar.tokenizeLine('T[5]')
      expect(tokens[0]).toEqual value: 'T', scopes: ['source.stan', 'keyword.other.truncation.stan']
      expect(tokens[1]).toEqual value: '[', scopes: ['source.stan', 'meta.brace.square.stan']
      expect(tokens[2]).toEqual value: '5', scopes: ['source.stan', 'constant.numeric.integer.stan']
      expect(tokens[3]).toEqual value: ']', scopes: ['source.stan', 'meta.brace.square.stan']

    it "does not tokenize variable ending in T", ->
      {tokens} = grammar.tokenizeLine('fooT')
      expect(tokens[0]).toEqual value: 'fooT', scopes: ['source.stan']

  describe "functions", ->
    it "tokenizes them", ->
      # only use a few examples
      functions = ['Phi', 'Phi_approx', 'abs', 'acos']
      for fxn in functions
        line = fxn
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: fxn, scopes: ['source.stan', 'support.function.function.stan']

  describe "distributions", ->
    it "tokenizes them following a ~", ->
      # only use a few examples
      distributions = ['normal', 'beta', 'cauchy']
      for distr in distributions
        line = '~ ' + distr
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: '~', scopes: ['source.stan', 'keyword.operator.sampling.stan']
        expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[2]).toEqual value: distr, scopes: ['source.stan', 'support.function.distribution.stan']

    it "tokenizes arbitrary distribution after ~", ->
      # only use a few examples
      line = '~ foo'
      {tokens} = grammar.tokenizeLine(line)
      expect(tokens[0]).toEqual value: '~', scopes: ['source.stan', 'keyword.operator.sampling.stan']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
      expect(tokens[2]).toEqual value: 'foo', scopes: ['source.stan']

    it "tokenizes them using when target += foo(y | theta)", ->
      # only use a few examples
      distributions = ['normal_lpdf', 'beta_lpdf', 'cauchy_lpdf']
      for distr in distributions
        line = 'target += ' + distr + '(a | b, c)'
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: 'target', scopes: ['source.stan', 'keyword.other.target.stan']
        expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[2]).toEqual value: '+=', scopes: ['source.stan', 'keyword.operator.accumulator.stan']
        expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[4]).toEqual value: distr, scopes: ['source.stan', 'support.function.function.stan']
        expect(tokens[5]).toEqual value: '(', scopes: ['source.stan', 'meta.brace.round.stan']
        expect(tokens[6]).toEqual value: 'a', scopes: ['source.stan']
        expect(tokens[7]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[8]).toEqual value: '|', scopes: ['source.stan', 'punctuation.sampling.bar.stan']
        expect(tokens[9]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[10]).toEqual value: 'b', scopes: ['source.stan']
        expect(tokens[11]).toEqual value: ',', scopes: ['source.stan', 'meta.delimiter.comma.stan']
        expect(tokens[12]).toEqual value: ' ', scopes: ['source.stan']
        expect(tokens[13]).toEqual value: 'c', scopes: ['source.stan']
        expect(tokens[14]).toEqual value: ')', scopes: ['source.stan', 'meta.brace.round.stan']

    it "does not tokenize them not following a ~", ->
      # only use a few examples
      distributions = ['normal', 'beta', 'cauchy']
      for distr in distributions
        line = distr
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: distr, scopes: ['source.stan']


  describe "reserved", ->
    it "tokenizes C++ reserved words", ->
      keywords = ['alignas', 'and', 'xor', 'xor_eq']
      for kw in keywords
        line = kw
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan', 'invalid.illegal.reserved.stan']

    it "tokenizes Stan reserved words", ->
      keywords = ['true', 'STAN_MAJOR', 'var', 'fvar']
      for kw in keywords
        line = kw
        {tokens} = grammar.tokenizeLine(line)
        expect(tokens[0]).toEqual value: kw, scopes: ['source.stan', 'invalid.illegal.reserved.stan']

  describe "variable names", ->
    it "tokenizes valid variable names", ->
      words = ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_abc',
               'a',
               'a3',
               'Sigma',
               'my_cpp_style_variable',
               'myCamelCaseVariable']
      for w in words
        {tokens} = grammar.tokenizeLine(w)
        expect(tokens[0]).toEqual value: w, scopes: ['source.stan']

    it "tokenizes invalid variable names", ->
      words =  ['a__', '1a', '_a', '_', 'lp__']
      for w in words
        {tokens} = grammar.tokenizeLine(w)
        expect(tokens[0]).toEqual value: w, scopes: ['source.stan', 'invalid.illegal.variable']

  describe "braces", ->
    it "tokenizes curly brackets", ->
      {tokens} = grammar.tokenizeLine('{}')
      expect(tokens[0]).toEqual value: '{', scopes: ['source.stan', 'punctuation.section.block.begin.stan']
      expect(tokens[1]).toEqual value: '}', scopes: ['source.stan', 'punctuation.section.block.end.stan']

      {tokens} = grammar.tokenizeLine('{real a;}')
      expect(tokens[0]).toEqual value: '{', scopes: ['source.stan', 'punctuation.section.block.begin.stan']
      expect(tokens[1]).toEqual value: 'real', scopes: ['source.stan', 'storage.type.stan']
      expect(tokens[2]).toEqual value: ' ', scopes: ['source.stan']
      expect(tokens[3]).toEqual value: 'a', scopes: ['source.stan']
      expect(tokens[4]).toEqual value: ';', scopes: ['source.stan', 'punctuation.terminator.statement.stan']
      expect(tokens[5]).toEqual value: '}', scopes: ['source.stan', 'punctuation.section.block.end.stan']

      lines = grammar.tokenizeLines """{
        real a;
      }
      """
      expect(lines[0][0]).toEqual value: '{', scopes: ['source.stan', 'punctuation.section.block.begin.stan']
      expect(lines[1][1]).toEqual value: 'real', scopes: ['source.stan', 'storage.type.stan']
      expect(lines[1][2]).toEqual value: ' ', scopes: ['source.stan']
      expect(lines[1][3]).toEqual value: 'a', scopes: ['source.stan']
      expect(lines[1][4]).toEqual value: ';', scopes: ['source.stan', 'punctuation.terminator.statement.stan']
      expect(lines[2][0]).toEqual value: '}', scopes: ['source.stan', 'punctuation.section.block.end.stan']

    it "tokenizes square brackets", ->
      brackets = ['[', ']']
      for b in brackets
        {tokens} = grammar.tokenizeLine(b)
        expect(tokens[0]).toEqual value: b, scopes: ['source.stan', 'meta.brace.square.stan']

    it "tokenizes curly brackets", ->
      brackets = ['(', ')']
      for b in brackets
        {tokens} = grammar.tokenizeLine(b)
        expect(tokens[0]).toEqual value: b, scopes: ['source.stan', 'meta.brace.round.stan']

  describe "statement terminator", ->
    it "parses it", ->
      {tokens} = grammar.tokenizeLine(';')
      expect(tokens[0]).toEqual value: ';', scopes: ['source.stan', 'punctuation.terminator.statement.stan']

      {tokens} = grammar.tokenizeLine('a = 1;')
      expect(tokens[0]).toEqual value: 'a', scopes: ['source.stan']
      expect(tokens[1]).toEqual value: ' ', scopes: ['source.stan']
      expect(tokens[2]).toEqual value: '=', scopes: ['source.stan', 'keyword.operator.assignment.stan']
      expect(tokens[3]).toEqual value: ' ', scopes: ['source.stan']
      expect(tokens[4]).toEqual value: '1', scopes: ['source.stan', 'constant.numeric.integer.stan']
      expect(tokens[5]).toEqual value: ';', scopes: ['source.stan', 'punctuation.terminator.statement.stan']

  describe "include preprocessor directive", ->
    it "parses it", ->
      {tokens} = grammar.tokenizeLine('#include "my_includes.txt"')
      expect(tokens[0]).toEqual value: '#', scopes: ['source.stan', 'comment.line.preprocessor.stan', 'punctuation.definition.comment.stan']
      expect(tokens[1]).toEqual value: 'include', scopes: ['source.stan', 'comment.line.preprocessor.stan', 'keyword.control.directive.include.stan']
      expect(tokens[3]).toEqual value: '"', scopes: ['source.stan', 'comment.line.preprocessor.stan', 'string.quoted.include.stan', 'punctuation.definition.string.begin.stan']
      expect(tokens[4]).toEqual value: 'my_includes.txt', scopes: ['source.stan', 'comment.line.preprocessor.stan', 'string.quoted.include.stan']
      expect(tokens[5]).toEqual value: '"', scopes: ['source.stan', 'comment.line.preprocessor.stan', 'string.quoted.include.stan', 'punctuation.definition.string.end.stan']
