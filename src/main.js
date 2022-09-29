#!/usr/bin/env node

/*
 * main.js
 * Export a security debt from DefectDojo.
 */

import { join } from "path";
import { DefectDojoApiClient } from "./defectdojo.js";
import { parseArgs } from "./cli.js";
import { loadConfig } from "./config.js";
import * as exporters from "./exports.js";

// Parse command-line arguments
const opts = parseArgs();

(async function () {

  // Load configuration
  const config = await loadConfig(opts.config);

  // Initialise the DefectDojo API client
  const defectDojo = new DefectDojoApiClient(opts.url, opts.token);

  // Fetch products
  const products = await opts.product
    .sort((p1, p2) => p1.localeCompare(p2))
    .reduce(async (prevResults, p) => {
      const results = await prevResults;
      const product = await defectDojo.getProduct(p);
      return [...results, product];
    }, []);

  // Fetch engagements
  const engagements = await products.reduce(async (prevResults, p) => {
    const results = await prevResults;
    const engagement = await defectDojo.getEngagement(p.id, opts.engagement);
    return [...results, engagement];
  }, []);

  // Fetch vulnerabilities
  const findings = await defectDojo.getFindings(engagements.map(e => e.id),
    opts.status);

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
    finding.tool = finding.related_fields.test.title ||
      finding.related_fields.test.test_type.name.replace(/Scan/g, "").trim();
    finding.occurrences = finding.nb_occurences || 1;
    finding.origin = finding.tags.find(t => originTags.includes(t)) ?? "";
    finding.sp_responsibility = finding.tags.includes(serviceProviderTag);
    finding.comment = finding.notes.join(" ");
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

})();
