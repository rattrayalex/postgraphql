import { memoize, fromPairs, includes, snakeCase, toUpper } from 'lodash'
import { getNullableType, GraphQLEnumType, GraphQLInt, GraphQLBoolean } from 'graphql'
import { CursorType } from './types.js'
import getColumnType from './getColumnType.js'

const createConnectionArgs = (table, ignoreColumnConditions = []) => ({
  // The column specified by `orderBy` means more than just the order to
  // return items in. This column is also the column we will use for
  // cursors.
  orderBy: {
    type: createTableOrderingEnum(table),
    description:
      'The order the resulting items should be returned in. This argument ' +
      'is also important as it is used in creating pagination cursors. This ' +
      'value’s default is the primary key for the object.',
    defaultValue: (() => {
      const column = table.getPrimaryKeyColumns()[0]
      if (column) return column.name
      return null
    })(),
  },
  first: {
    type: GraphQLInt,
    description:
      'The top `n` items in the set to be returned. Can’t be used ' +
      'with `last`.',
  },
  last: {
    type: GraphQLInt,
    description:
      'The bottom `n` items in the set to be returned. Can’t be used ' +
      'with `first`.',
  },
  before: {
    type: CursorType,
    description: 'Constrains the set to nodes *before* this cursor in the specified ordering.',
  },
  after: {
    type: CursorType,
    description: 'Constrains the set to nodes *after* this cursor in the specified ordering.',
  },
  offset: {
    type: GraphQLInt,
    description: 'An integer offset representing how many items to skip in the set.',
  },
  descending: {
    type: GraphQLBoolean,
    description:
      'If `true` the nodes will be in descending order, if `false` the ' +
      'items will be in ascending order. `false` by default.',
    defaultValue: false,
  },
  ...fromPairs(
    table.columns
    .filter(column => !includes(ignoreColumnConditions, column))
    .map(column => [column.getFieldName(), {
      type: getNullableType(getColumnType(column)),
      description:
        'Filters the resulting set with an equality test on the ' +
        `${column.getMarkdownFieldName()} field.`,
    }])
  ),
})

export default createConnectionArgs

/**
 * Creates an ordering enum which simply contains all of a `Table`s columns.
 *
 * @param {Table} table
 * @returns {GraphQLEnumType}
 */
// TODO: Some way to eliminate some columns from ordering enum?
const createTableOrderingEnum = memoize(table =>
  new GraphQLEnumType({
    name: `${table.getTypeName()}Ordering`,
    description: `Properties with which ${table.getMarkdownTypeName()} can be ordered.`,

    values: fromPairs(
      table.columns
      .map(column => [toUpper(snakeCase(column.getFieldName())), {
        value: column.name,
        description: column.description,
      }])
    ),
  }))
