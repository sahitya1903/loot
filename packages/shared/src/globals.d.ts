// @loot/shared is compiled without DOM/Node libs so browser-only APIs can't
// creep in. `console` exists in every host (browser, Node, Hermes).
declare const console: {
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
}
