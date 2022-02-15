#!/usr/bin/env node

/*
 * main.js
 * Exporte la dette sécurité au format Orange depuis DefectDojo.
 */

import { join } from "path";
import { DefectDojoApiClient } from "./defectdojo.js";
import { parseArgs } from "./cli.js";
import * as exporters from "./exports.js";

// Récupération des arguments passés au programme
const args = parseArgs();

(async function () {

  const defectDojo = new DefectDojoApiClient(args.url, args.token);

  // Récupération du produit
  const product = await defectDojo.getProduct(args.product);

  // Récupération de l'engagement
  const engagement = await defectDojo.getEngagement(product.id, args.engagement);

  // Récupération des vulnérabilités
  const findings = await defectDojo.getFindings(engagement.id, args.statuses.split(","));

  /*
   * Calcul des champs additionnels dont la criticité résultante
   */

  console.log("[info] Computing additional fields");

  const impacts = ["informational", "low", "medium", "high", "critical"];
  const eases = ["undefined", "very hard", "hard", "moderate", "easy"];
  const criticities = ["undefined", "minor", "medium", "high", "critical"];
  const matrix = [
    [1, 1, 2, 2], // minor   minor   medium    medium
    [1, 2, 3, 3], // minor   medium  high      high
    [2, 2, 3, 4], // medium  medium  high      critical
    [3, 3, 4, 4]  // high    high    critical  critical
  ];
  for (const finding of findings) {
    // Criticité résultante
    finding.severity = finding.severity?.toLowerCase();
    const i = Math.max(impacts.findIndex(i => i == finding.severity), 0);
    const e = parseInt((finding.tags?.find(t => t.match(/^e[1-4]$/)) || "e0")[1]);
    finding.ease_index = e;
    finding.ease = eases[e];
    finding.criticity_index = e * i > 0 ? matrix[e - 1][i - 1] : 0;
    finding.criticity = criticities[finding.criticity_index];
    finding.severity_index = i;
    // Autres champs
    finding.tool = finding.related_fields.test.test_type.name.replace(/Scan/g, "").trim();
    finding.occurrences = finding.nb_occurences || 1;
    finding.origin = finding.tags.find(t => /init(ial)?|run|alert|reversibility/.test(t)) ?? "";
    finding.ssg_responsibility = finding.tags.includes("ssg");
    finding.comment = finding.notes.join(" ");
  }

  console.log("[info] Vulnerabilities:", criticities.map(c =>
    findings.filter(f => f.criticity == c).length + " " + c).join(", "));

  /*
   * Exportation
   */

  const path = args.output ?? join(process.cwd(), `Security-Debt_${product.name}`);
  const opts = { separator: ";" };

  for (const format of args.formats.split(",")) {
    console.log(`[info] Exporting to ${format.toUpperCase()}:`, path + "." + format);
    await exporters["exportTo" + format.toUpperCase()](product, engagement, findings, path + "." + format, opts);
  }

})();
