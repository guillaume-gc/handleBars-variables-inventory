import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import { join } from 'path'

const getHandlebarsVariables = (input: string): string[] => {
  const ast: hbs.AST.Program = Handlebars.parseWithoutProcessing(input)

  return iterateBodyStatements(ast.body)
}

const iterateBodyStatements = (bodyStatements: hbs.AST.Statement[]): string[] =>
  bodyStatements
    .map((statement: hbs.AST.Statement) => {
      switch (statement.type) {
        case 'MustacheStatement':
          return iterateMustacheStatement(
            statement as hbs.AST.MustacheStatement,
          )
        case 'BlockStatement':
          return iterateBlockStatement(statement as hbs.AST.BlockStatement)
        default:
          return []
      }
    })
    .flat()
    .filter((expression) => expression)

const iterateBlockStatement = (statement: hbs.AST.BlockStatement): string[] => {
  const paramsExpressions = statement.params as hbs.AST.PathExpression[]

  const defaultValue = {
    body: [],
  }
  const { program = defaultValue, inverse = defaultValue } = statement
  const fullBody = [...program.body, ...inverse.body]

  return [
    ...iteratePathExpressions(paramsExpressions),
    ...iterateBodyStatements(fullBody),
  ]
}

const iterateMustacheStatement = (
  statement: hbs.AST.MustacheStatement,
): string[] => {
  let pathExpressions
  if (statement.params.length) {
    pathExpressions = statement.params as hbs.AST.PathExpression[]
  }
  else {
    pathExpressions = [statement.path] as hbs.AST.PathExpression[]
  }

  return iteratePathExpressions(pathExpressions)
}

const iteratePathExpressions = (pathExpressions: hbs.AST.PathExpression[]): string[] => (
  pathExpressions
      .filter(({type}) => type === 'PathExpression')
      .map((expression) => expression.original)
)

const path = join(__dirname, '/../sample/sample_all.html')
const sampleData = readFileSync(path, 'utf8')

const result = getHandlebarsVariables(sampleData)

console.log(result)
