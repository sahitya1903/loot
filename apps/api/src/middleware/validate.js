/** Parses `req.body` with the schema and replaces it with the parsed value. ZodErrors become 400s. */
export function validateBody(schema) {
  return (req, _res, next) => {
    req.body = schema.parse(req.body)
    next()
  }
}
