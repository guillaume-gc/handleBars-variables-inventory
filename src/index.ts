import { readFileSync, writeFileSync } from 'fs'
import Handlebars from 'handlebars'
import { join } from 'path'

import DecoratorBlock = hbs.AST.DecoratorBlock
import BlockStatement = hbs.AST.BlockStatement
import MustacheStatement = hbs.AST.MustacheStatement
import PathExpression = hbs.AST.PathExpression
import Program = hbs.AST.Program
import Statement = hbs.AST.Statement
import Expression = hbs.AST.Expression

const getHandlebarsVariables = (input: string): string[] => {
  // Root Handlebars program, a program represents a node inside Handlebars element tree.
  const ast: Program = Handlebars.parseWithoutProcessing(input)

  // A body include all nested elements.
  return iterateBodyStatements(ast.body)
}

/**
 * Recursive iteration in Handlebars statements
 *
 * Iteration ignore statements with no variable and no nested statement with a variable
 * As a reminder, Handlebars statement are values between two curly brackets (example: '{{variable}}')
 */
const iterateBodyStatements = (statements: Statement[]): string[] =>
  statements
    .map((statement: hbs.AST.Statement) => {
      switch (statement.type) {
        // Mustache Statements contain a variable
        case 'MustacheStatement':
          return iterateMustacheStatement(statement as MustacheStatement)
        // Block Statements contain anything inside a block.
        case 'BlockStatement':
          return iterateBlock(statement as BlockStatement)
        // Decorators Blocks contain anything in the block statement (ie: variables used for a condition)
        case 'DecoratorBlock':
          return iterateBlock(statement as BlockStatement)
        default:
          return []
      }
    })
    .flat()
    .filter((expression) => expression)

/**
 * Recursive iteration in a Handlebars Block
 *
 * As a reminder, Blocks represent conditions, loops, etc...
 */
const iterateBlock = (statement: BlockStatement | DecoratorBlock): string[] => {
  const paramsExpressions = statement.params as PathExpression[]

  const blockVariables = getBlockVariables(statement)
  const paramsValues = iterateExpressions(paramsExpressions)

  return [...paramsValues, ...blockVariables]
}

/**
 * Get variables directly inside a Handlebars Block, and iterate through its body (nested statements)
 */
const getBlockVariables = (
  statement: hbs.AST.BlockStatement | DecoratorBlock,
): string[] => {
  const defaultValue = {
    body: [],
  }
  const { program = defaultValue, inverse = defaultValue } = statement
  const fullBody = [...program.body, ...inverse.body]

  return iterateBodyStatements(fullBody)
}

/**
 * Iterate through a Mustache statement (curly brackets) to get all variables inside
 */
const iterateMustacheStatement = ({
  params,
  path,
}: MustacheStatement): string[] => {
  // A variable may be stored in either its parameters or pathValue, but always in a PathExpression object
  let expressions
  if (params.length) {
    expressions = params as Expression[]
  } else {
    expressions = [path] as Expression[]
  }

  return iterateExpressions(expressions)
}

/**
 * Iterate through a list of expression to find all variables in compatible expression types
 */
const iterateExpressions = (expression: Expression[]): string[] =>
  expression
    // Remove any non PathExpression Object, since others don't store variables
    .filter(({ type }) => type === 'PathExpression')
    .map((expression) => {
      const pathExpression = expression as PathExpression
      return pathExpression.original
    })

const pathSample = join(__dirname, '../sample/sample_all.html')
const sampleData = readFileSync(pathSample, 'utf-8')

const result = getHandlebarsVariables(sampleData)

const pathResult = join(__dirname, '../result/result_sample_all.json')
const resultString = JSON.stringify(result, null, 2)
writeFileSync(pathResult, resultString, 'utf-8')

console.log(result)
