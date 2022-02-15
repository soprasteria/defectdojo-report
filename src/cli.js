/*
 * cli.js
 * Service d'interaction avec la ligne de commande et l'environnement.
 */

/**
 * Statuts pouvant être fournis en argument
 */
const statuses = ["active", "verified", "false_p", "duplicate", "out_of_scope", "risk_accepted", "under_review", "is_mitigated"];

/**
 * Arguments attendus par le programme
 * (via la ligne de commande ou les variables d'environnement)
 */
const expectedArgs = [
  { name: "url", env: "DEFECTDOJO_URL", pattern: /^https?:\/\/.+$/ },
  { name: "token", env: "DEFECTDOJO_TOKEN", pattern: /^\w{40}$/ },
  { name: "product", env: "DEFECTDOJO_PRODUCT", pattern: /^[\w-\/]+$/ },
  { name: "engagement", env: "DEFECTDOJO_ENGAGEMENT", pattern: /^[\w-\/]+$/ },
  { name: "statuses", env: "DEFECTDOJO_STATUSES", pattern: `^((${statuses.map(s => "!?" + s).join("|")})[,$])+`, default: "active" },
  { name: "output", env: "SECDEBT_OUTPUT", pattern: `.+`, default: null },
  { name: "formats", env: "SECDEBT_FORMATS", pattern: /^((csv|html|json)[,$])+/, default: "csv,html,json" }
];

/**
 * Extrait et valide les arguments passés au programme
 * via la ligne de commande ou les variables d'environnements.
 *
 * @returns Arguments du programme
 */
export function parseArgs() {
  // Affichage du message d'aide
  if (process.argv.some(a => a.match(/^--?h(elp)?$/))) {
    console.log(`Usage: dd-to-osdf [arguments]

Arguments:
  CLI           Environnement          Description
  --url         DEFECTDOJO_URL         Root URL to DefectDojo
  --token       DEFECTDOJO_TOKEN       API V2 authentication token
  --product     DEFECTDOJO_PRODUCT     Product name on DefectDojo
  --engagement  DEFECTDOJO_ENGAGEMENT  Engagement name on DefectDojo
  --statuses    DEFECTDOJO_STATUSES    Finding statuses to include or !exclude (default: active)
  --output      SECDEBT_OUTPUT         Path to the output file, without extension (default: ./Security-Debt_{product})
  --formats     SECDEBT_FORMATS        File formats to export (default: csv,html,json)
  -h, --help                           Show the help message`);
    process.exit(0);
  }

  const args = {};

  // Extraction des arguments
  for (const arg of expectedArgs) {
    // Extraction depuis la ligne de commande
    const i = process.argv.findIndex(a => a == `--${arg.name}`);
    let value = undefined;
    if (i >= 0 && i + 1 < process.argv.length) {
      value = process.argv[i + 1];
    }
    // Extraction depuis les variables d'environnement
    if (!value) {
      value = process.env[arg.env];
    }
    // Validation de la valeur fournie
    if (!value && arg.default === undefined) {
      console.error(`[error] Argument '${arg.name}' is required`);
      process.exit(1);
    } else if (value && !(new RegExp(arg.pattern)).test(value)) {
      console.error(`[error] Invalid argument '${arg.name}'`);
      process.exit(1);
    }
    args[arg.name] = value || arg.default;
  }

  return args;
}
