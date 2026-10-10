/** Parses `req.body` with the schema and replaces it with the parsed value. ZodErrors become 400s. */
export function validateBody(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body)
    next()
  }
}

/** Parses the query string into `req.parsedQuery` (Express 5 makes `req.query` read-only). */
export function validateQuery(schema) {
  return (req, _res, next) => {
    req.parsedQuery = schema.parse(req.query)
    next()
  }
}
