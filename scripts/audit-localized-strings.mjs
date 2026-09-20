import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/**
 * Salla's publication check rejects a bundle when a value that *looks* like a
 * `multilanguage: true` field is interpolated into a template without being
 * resolved first — the "Objects are not valid as a React child" (React #31)
 * class of crash. Its heuristic is textual, not semantic: for every `${…}` on
 * a line it takes the words inside the braces and rejects the line when any of
 * them matches a multilanguage field id anywhere in the bundle, unless the
 * expression mentions `localizedString`.
 *
 * That means a plain `const title = this.localizedString(c.section_title)`
 * followed by `${title}` is still rejected — the interpolation itself carries
 * no evidence of the call. It also fires on `${it.label}`, on an option object
 * key called `text`, and on a bare `"quote"` string argument. The convention
 * this bundle follows, and this audit enforces, is to name every such binding
 * `localizedTitle` / `localizedLabel` / … and to keep field-id words out of
 * interpolations that carry something else entirely.
 *
 * The scan covers the component sources; pass `--dist` to include `dist/*.js`
 * too, since the released bundle is read from `dist/` and the reviewer's report
 * cited both. `prebuild` runs the source scan (dist is still the previous
 * build at that point, so failing on it would be unfixable); `postbuild` runs
 * the full one.
 */

const BUNDLE = "twilight-bundle.json";
const WORD = /[A-Za-z_$][A-Za-z0-9_$]*/g;
const STRING = /"([^"\\]*)"|'([^'\\]*)'/g;

function multilanguageIds(bundle) {
  const ids = new Set();
  const walk = (fields) => {
    for (const field of fields || []) {
      if (!field || typeof field !== "object") continue;
      if (field.multilanguage === true && field.id) ids.add(field.id);
      walk(field.fields);
    }
  };
  for (const component of bundle.components || []) walk(component.fields);
  return ids;
}

/** Every `${…}` in the file, brace-balanced, with its 0-based offset. */
function* interpolations(source) {
  let from = 0;
  for (;;) {
    const open = source.indexOf("${", from);
    if (open < 0) return;
    let cursor = open + 2;
    let depth = 1;
    while (cursor < source.length && depth > 0) {
      if (source[cursor] === "{") depth += 1;
      else if (source[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    yield { offset: open, expression: source.slice(open + 2, cursor - 1) };
    from = open + 2;
  }
}

/**
 * Words the check can see. String literals contribute only when the whole
 * literal is a field id (`this._icon("quote")` was rejected; an English
 * sentence containing the word "question" was not).
 */
function candidateWords(expression, ids) {
  const literals = new Set();
  const stripped = expression.replace(STRING, (match, dq, sq) => {
    const body = dq ?? sq ?? "";
    if (ids.has(body)) literals.add(body);
    return " ";
  });
  return new Set([...(stripped.match(WORD) || []), ...literals]);
}

const ids = multilanguageIds(JSON.parse(fs.readFileSync(BUNDLE, "utf8")));

const withDist = process.argv.includes("--dist");

const targets = [
  ...fs
    .readdirSync(path.join("src", "components"))
    .map((name) => path.join("src", "components", name, "index.ts")),
  ...(withDist && fs.existsSync("dist")
    ? fs
        .readdirSync("dist")
        .filter((name) => name.endsWith(".js"))
        .map((name) => path.join("dist", name))
    : []),
].filter((file) => fs.existsSync(file) && fs.statSync(file).isFile());

const findings = [];
for (const file of targets) {
  const source = fs.readFileSync(file, "utf8");
  for (const { offset, expression } of interpolations(source)) {
    // Only the innermost expression is read; the HTML around a nested template
    // is markup, and its class names are not values.
    if (expression.includes("${")) continue;
    if (expression.includes("localizedString")) continue;
    const hits = [...candidateWords(expression, ids)].filter((word) =>
      ids.has(word),
    );
    if (hits.length === 0) continue;
    findings.push({
      file,
      line: source.slice(0, offset).split("\n").length,
      hits,
      expression: expression.trim().replace(/\s+/g, " ").slice(0, 80),
    });
  }
}

console.log(
  `Checked ${targets.length} files against ${ids.size} multilanguage field ids.`,
);
for (const finding of findings) {
  console.error(
    `${finding.file}:${finding.line}: \`${finding.expression}\` reads like ${finding.hits.join(", ")} — rename the binding to localizedX or drop the word.`,
  );
}

if (findings.length > 0) process.exitCode = 1;
else console.log("No unlocalized-looking interpolations.");
