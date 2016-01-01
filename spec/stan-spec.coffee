fs = require 'fs'
path = require 'path'

describe "Stan grammar", ->
  grammar = null

  beforeEach ->
    waitsForPromise ->
      atom.packages.activatePackage("language-stan")

    runs ->
      grammar =atom.grammars.grammarForScopeName("source.stan")

    it "parses the grammar", ->
      expect(grammar).toBeTruthy()
      expect(grammar.scope).toBe "source.stan"
