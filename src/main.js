/*
 * main.js
 * Export a security debt from DefectDojo.
 */

import { join } from "path";
import { parseArgs } from "./cli.js";
import { loadConfig } from "./config.js";
import { DefectDojoApiClient } from "./defectdojo.js";
import * as exporters from "./exports.js";

export async function main() {
  // Parse command-line arguments
  const opts = await parseArgs()
    .catch((e) => process.exit(e.exitCode));

  // Load configuration
  const config = await loadConfig(opts.config)
    .catch((e) => { console.error(`[error] ${e.message}`); process.exit(1); });

  // Initialise the DefectDojo API client
  const defectDojo = new DefectDojoApiClient(opts.url, opts.token);

  // Fetch products
  const products = await opts.product
    .sort((p1, p2) => p1.localeCompare(p2))
    .reduce(async (prevResults, p) => {
      const results = await prevResults;
      const product = await defectDojo.getProduct(p)
        .catch((e) => { console.error(`[error] ${e.message}`); process.exit(1); });
      return [...results, product];
    }, []);

  // Fetch engagements
  const engagements = await products.reduce(async (prevResults, p) => {
    const results = await prevResults;
    const engagements = await defectDojo.getEngagements(p.id, opts.engagement)
      .catch((e) => { console.error(`[error] ${e.message}`); process.exit(1); });
    p.engagements = engagements;
    return [...results, ...engagements];
  }, []);

  // Fetch vulnerabilities
  const findings = await defectDojo
    .getFindings(engagements.map(e => e.id), opts.status)
    .catch((e) => { console.error(`[error] ${e.message}`); process.exit(1); });

  /*
   * Process vulnerabilities
   */

  console.log("[info] Processing findings");

  const { impacts, eases, easeTags, criticities,
    criticityMatrix, originTags, serviceProviderTag } = config;

  // Compute additional fields
  for (const finding of findings) {
    // Resultant criticity
    finding.severity = finding.severity?.toLowerCase();
    const i = Math.max(impacts.findIndex(i => i == finding.severity), 0);
    const e = easeTags.indexOf(finding.tags?.find(t => easeTags.includes(t)) ?? easeTags[0]);
    finding.ease_index = e;
    finding.ease = eases[e];
    finding.criticity_index = e * i > 0 ? criticityMatrix[e - 1][i - 1] : 0;
    finding.criticity = criticities[finding.criticity_index];
    finding.severity_index = i;
    // Other fields
    finding.product = finding?.related_fields?.test?.engagement?.product ?? { id: -1, name: "" };
    finding.engagement = finding?.related_fields?.test?.engagement ?? { id: -1, name: "", version: "" };
    finding.tool = finding.related_fields.test.test_type.name.replace(/ Scan($| )/g, "$1").trim();
    finding.occurrences = finding.nb_occurences || 1;
    finding.origin = finding.tags.find(t => originTags.includes(t)) ?? "";
    finding.sp_responsibility = finding.tags.includes(serviceProviderTag);
    finding.comment = finding.notes.map(n => n.entry ?? "").join("\n");
  }

  // Sort by product.name (asc), criticity_index (desc), tool (asc),
  // severity_index (desc), title (asc)
  findings.sort((f1, f2) => f1.product.name.localeCompare(f2.product.name) ||
    (f2.criticity_index - f1.criticity_index) || f1.tool.localeCompare(f2.tool) ||
    (f2.severity_index - f1.severity_index) || f1.title.localeCompare(f2.title));

  console.log("[info] Vulnerabilities:", criticities.map(c =>
    findings.filter(f => f.criticity == c).length + " " + c).join(", "));

  /*
   * Generate reports
   */

  const defaultReportName = "Security-Debt" + (products.length == 1 ? `_${products[0].name}` : "");
  const path = opts.output ?? join(process.cwd(), defaultReportName);

  for (const format of opts.format) {
    console.log(`[info] Exporting to ${format.toUpperCase()}:`, path + "." + format);
    await exporters["exportTo" + format.toUpperCase()](products, engagements,
      findings, path + "." + format, config, { separator: ";" });
  }
}
