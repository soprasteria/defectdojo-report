/*
 * cli.js
 * CLI and environment handling service
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Statuses expected for the "status" CLI option
 */
const statuses = ["active", "verified", "false_p", "duplicate", "out_of_scope",
  "risk_accepted", "under_review", "is_mitigated"];

/**
 * Options expected by the tool
 * (from the command line or environment variables)
 */
const expectedOptions = [
  {
    name: "url",
    env: "DEFECTDOJO_URL",
    description: "Root URL to DefectDojo",
    pattern: /^https?:\/\/.+$/
  },
  {
    name: "token",
    env: "DEFECTDOJO_TOKEN",
    description: "API V2 authentication token",
    pattern: /^\w{40}$/
  },
  {
    name: "product",
    env: "DEFECTDOJO_PRODUCT",
    description: "Product name(s) on DefectDojo, comma separated",
    pattern: /^([\w/.-]+(,|$))+$/,
    csv: true
  },
  {
    name: "engagement",
    env: "DEFECTDOJO_ENGAGEMENT",
    description: "Engagement name on DefectDojo (optional)",
    pattern: /^[\w/.-]+$/,
    default: null
  },
  {
    name: "status",
    env: "DEFECTDOJO_STATUS",
    description: "Finding status(es) to include or !exclude, comma separated (default: active)",
    pattern: `^((${statuses.map(s => "!?" + s).join("|")})(,|$))+$`,
    csv: true,
    default: "active"
  },
  {
    name: "output",
    env: "SECDEBT_OUTPUT",
    description: "Path to the output file, without extension (default: ./Security-Debt[_{product}])",
    pattern: /.+/,
    default: null
  },
  {
    name: "format",
    env: "SECDEBT_FORMAT",
    description: "File format(s) to export, comma separated (default: csv,html,json)",
    pattern: /^((csv|html|json)(,|$))+$/,
    csv: true,
    default: "csv,html,json"
  },
  {
    name: "config",
    env: "SECDEBT_CONFIG",
    description: "Path to the configuration customization JSON file (optional)",
    pattern: /^.+$/,
    file: true,
    default: null
  }
];

/**
 * Extract and validate provided arguments
 * using the command line or environment variables.
 *
 * @returns {Promise<*>} Program options
 * @throws {CliError} When the program must exit.
 */
export async function parseArgs() {
  // Read package metadata from package.json
  const npmPackagePath = join(import.meta.dirname, "../package.json");
  const npmPackage = JSON.parse(await readFile(npmPackagePath, { encoding: "utf8" }));

  // Show the help message
  if (process.argv.some(a => a.match(/^--?h(elp)?$/))) {
    console.log(`Usage: ${npmPackage.name} [options]\n`
      + `\n${npmPackage.description}\n`
      + "\nOptions:"
      + "\n  CLI           Environnement          Description\n"
      + expectedOptions
        .map(a => `  --${a.name.padEnd(11)} ${a.env.padEnd(22)} ${a.description}`)
        .join("\n")
      + "\n  -h, --help                           Show the help message"
      + "\n  -v, --version                        Show the version number");
    throw new CliError(0);
  }

  // Show the version number
  if (process.argv.some(a => a.match(/^--?v(ersion)?$/))) {
    console.log(npmPackage.version);
    throw new CliError(0);
  }

  const opts = {};

  // Extract options
  for (const opt of expectedOptions) {
    // From the command line
    const i = process.argv.findIndex(a => a === `--${opt.name}`);
    let value = undefined;
    if (i >= 0 && i + 1 < process.argv.length) {
      value = process.argv[i + 1];
    }
    // From environment variables
    if (!value) {
      value = process.env[opt.env];
    }
    // Validate the value
    if (!value && opt.default === undefined) {
      console.error(`[error] Argument '${opt.name}' is required`);
      throw new CliError(1);
    } else if (value && !(new RegExp(opt.pattern)).test(value)) {
      console.error(`[error] Invalid argument '${opt.name}'`);
      throw new CliError(1);
    }
    // Validate the file path
    if (value && opt.file && !existsSync(value)) {
      console.error(`[error] Argument '${opt.name}' must be a path to an existing file`);
      throw new CliError(1);
    }
    // Take the default value into account
    value = value || opt.default;
    // Parse variadic options
    if (value && opt.csv) {
      value = value.split(",").map(v => v.trim()).filter(v => v);
    }
    opts[opt.name] = value;
  }

  return opts;
}

/**
 * An error thrown during arguments parsing.
 */
export class CliError extends Error {

  /**
   * Initialize a CLI error.
   *
   * @param {number} exitCode Process exit code
   * @param {string} message Error message
   */
  constructor(exitCode = 1, message = "") {
    super(message);
    this.exitCode = exitCode;
  }

}
