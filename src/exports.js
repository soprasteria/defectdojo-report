/*
 * exports.js
 * Service d'exportation de la dette de sécurité en plusieurs formats.
 */

import { dirname, join } from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { resolveField } from "./config.js";

/**
 * Exporte les vulnérabilités vers un fichier CSV.
 *
 * @param {Array} _products Produit(s) DefectDojo (non utilisé)
 * @param {Array} _engagements Engagement(s) DefectDojo (non utilisé)
 * @param {Array} findings Liste des vulnérabilités
 * @param {string} path Chemin vers le fichier CSV à créer
 * @param {*} config Configuration
 * @param {{separator: string}} options Options d'exportation CSV
 */
export async function exportToCSV(_products, _engagements, findings, path, config, options) {
  const sep = options?.separator ?? ",";
  const data = Object.keys(config.fields).map(h => `"${h}"`).join(sep) + "\n" +
    findings.map(finding => Object.values(config.fields)
      .map(f => resolveField(finding, f).value)
      .map(f => `"${f?.toString().replace(/["\n\r]/g, " ")}"`).join(sep)).join("\n");

  // Écriture du fichier
  await writeFile(path, data, { encoding: "utf8" });
}

/**
 * Exporte les vulnérabilités vers un fichier HTML.
 *
 * @param {Array} products Produit(s) DefectDojo
 * @param {Array} engagements Engagement(s) DefectDojo
 * @param {Array} findings Liste des vulnérabilités
 * @param {string} path Chemin vers le fichier HTML à créer
 * @param {*} config Configuration
 */
export async function exportToHTML(products, engagements, findings, path, config) {
  // Récupération du template
  const templateFile = join(dirname(fileURLToPath(import.meta.url)), "template.ejs");
  const template = await readFile(templateFile, { encoding: "utf8" });

  // Exportation des vulnérabilités
  const headers = Object.keys(config.fields);
  const findingsFields = findings.map(finding => Object.values(config.fields)
    .map(f => resolveField(finding, f)));
  const html = ejs.render(template, {
    config, products, engagements,
    findings: findingsFields, headers
  });

  // Écriture du fichier
  await writeFile(path, html, { encoding: "utf8" });
}

/**
 * Exporte les vulnérabilités vers un fichier JSON.
 *
 * @param {Array} products Produit(s) DefectDojo
 * @param {Array} engagements Engagement(s) DefectDojo
 * @param {Array} findings Liste des vulnérabilités
 * @param {string} path Chemin vers le fichier JSON à créer
 * @param {*} _config Configuration (non utilisé)
 */
export async function exportToJSON(products, engagements, findings, path, _config) {
  const data = { products, engagements, findings };
  await writeFile(path, JSON.stringify(data), { encoding: "utf8" });
}
