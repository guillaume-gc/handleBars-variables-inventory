import { readFileSync } from 'fs'
import Handlebars from 'handlebars'
import { join } from 'path'

const getHandlebarsVariables = (input: string): string[] => {
  const ast: hbs.AST.Program = Handlebars.parseWithoutProcessing(input)

  return ast.body
    .filter(({ type }: hbs.AST.Statement) => type === 'MustacheStatement')
    .map((statement: hbs.AST.Statement) => {
      const moustacheStatement: hbs.AST.MustacheStatement =
        statement as hbs.AST.MustacheStatement
      const paramsExpressionList =
        moustacheStatement.params as hbs.AST.PathExpression[]
      const pathExpression = moustacheStatement.path as hbs.AST.PathExpression

      return paramsExpressionList[0]?.original || pathExpression.original
    })
}

const path = join(__dirname, '/../sample/sample_all.html')
const sampleData = readFileSync(path, 'utf8')

const result = getHandlebarsVariables(sampleData)

console.log(result)
