#!/usr/bin/env node

/*
 * main.js
 * Exporte la dette sécurité au format Orange depuis DefectDojo.
 */

import { join } from "path";
import { DefectDojoApiClient } from "./defectdojo.js";
import { parseArgs } from "./cli.js";
import { loadConfig } from "./config.js";
import * as exporters from "./exports.js";

// Récupération des arguments passés au programme
const args = parseArgs();

(async function () {

  // Récupération de la configuration
  const config = await loadConfig(args.config);

  // Initialisation du client pour l'API DefectDojo
  const defectDojo = new DefectDojoApiClient(args.url, args.token);

  // Récupération des produits
  const products = await args.product
    .sort((p1, p2) => p1.localeCompare(p2))
    .reduce(async (prevResults, p) => {
      const results = await prevResults;
      const product = await defectDojo.getProduct(p);
      return [...results, product];
    }, []);

  // Récupération des engagements
  const engagements = await products.reduce(async (prevResults, p) => {
    const results = await prevResults;
    const engagement = await defectDojo.getEngagement(p.id, args.engagement);
    return [...results, engagement];
  }, []);

  // Récupération des vulnérabilités
  const findings = await defectDojo.getFindings(engagements.map(e => e.id),
    args.status);

  /*
   * Traitement des vulnérabilités
   */

  console.log("[info] Processing findings");

  const { impacts, eases, easeTags, criticities,
    criticityMatrix, originTags, serviceProviderTag } = config;

  // Calcul des champs additionnels dont la criticité résultante
  for (const finding of findings) {
    // Criticité résultante
    finding.severity = finding.severity?.toLowerCase();
    const i = Math.max(impacts.findIndex(i => i == finding.severity), 0);
    const e = easeTags.indexOf(finding.tags?.find(t => easeTags.includes(t)) ?? easeTags[0]);
    finding.ease_index = e;
    finding.ease = eases[e];
    finding.criticity_index = e * i > 0 ? criticityMatrix[e - 1][i - 1] : 0;
    finding.criticity = criticities[finding.criticity_index];
    finding.severity_index = i;
    // Autres champs
    finding.product = finding?.related_fields?.test?.engagement?.product ?? { id: -1, name: "" };
    finding.engagement = finding?.related_fields?.test?.engagement ?? { id: -1, name: "", version: "" };
    finding.tool = finding.related_fields.test.title ||
      finding.related_fields.test.test_type.name.replace(/Scan/g, "").trim();
    finding.occurrences = finding.nb_occurences || 1;
    finding.origin = finding.tags.find(t => originTags.includes(t)) ?? "";
    finding.sp_responsibility = finding.tags.includes(serviceProviderTag);
    finding.comment = finding.notes.join(" ");
  }

  // Tri par product.name (asc), criticity_index (desc), tool (asc),
  // severity_index (desc), title (asc)
  findings.sort((f1, f2) => f1.product.name.localeCompare(f2.product.name) ||
    (f2.criticity_index - f1.criticity_index) || f1.tool.localeCompare(f2.tool) ||
    (f2.severity_index - f1.severity_index) || f1.title.localeCompare(f2.title));

  console.log("[info] Vulnerabilities:", criticities.map(c =>
    findings.filter(f => f.criticity == c).length + " " + c).join(", "));

  /*
   * Exportation
   */

  const defaultReportName = "Security-Debt" + (products.length == 1 ? `_${products[0].name}` : "");
  const path = args.output ?? join(process.cwd(), defaultReportName);
  const opts = { separator: ";" };

  for (const format of args.format) {
    console.log(`[info] Exporting to ${format.toUpperCase()}:`, path + "." + format);
    await exporters["exportTo" + format.toUpperCase()](products, engagements,
      findings, path + "." + format, config, opts);
  }

})();
