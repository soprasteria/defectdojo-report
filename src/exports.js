/*
 * exports.js
 * Service d'exportation de la dette de sécurité en plusieurs formats.
 */

import { dirname, join } from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import ejs from "ejs";

/**
 * En-têtes du tableau des vulnérabilités
 */
const headers = [
  "Application", // or BASICAT
  "Origin of the audit", // Initial, Run, Alert, Reversibility
  "Date of first detection",
  "Application version of first detection", // GOROCO
  "Security tools used", // Dependency-Check, SonarQube, ZAP, Checkmarx, Manual or Others
  "Tool (or pattern) version",
  "Location of the vulnerability", // Class or file name
  "Title of the vulnerability", // from the security tools of alert bulleting
  "Nb occurrences",
  "Impact", // Audit vision
  "Ease of exploitation",
  "Resultant criticity",
  "Effort for fixing vulnerability", // Low, Medium or High
  "Status", // Open, Analyzed, Waiting, Planned, Processed, Cancelled or Duplicate
  "Recurrence", // New, Recurrent, Fixed or Duplicate
  "App release that contains the fix", // if planned or processed
  "Responsibility Sopra Steria", // Y/N
  "Origin of responsibility", // Framework, third-party code, detected in the beginning of the project
  "Comments",
  "Mitigation"
];

/**
 * Exporte les vulnérabilités vers un fichier CSV.
 *
 * @param {{name: string}} product Produit DefectDojo
 * @param {{version: string}} engagement Engagement DefectDojo
 * @param {Array} findings Liste des vulnérabilités
 * @param {string} path Chemin vers le fichier CSV à créer
 * @param {{separator: string}} options Options d'exportation CSV
 */
export async function exportToCSV(product, engagement, findings, path, options) {
  const sep = options?.separator ?? ",";
  const data = headers.map(h => `"${h}"`).join(sep) + "\n" +
    findings.map(finding => [
      product.name,
      finding.origin,
      finding.date,
      engagement.version,
      finding.tool,
      "", // TODO Tool (or pattern) version
      finding.file_path,
      finding.title,
      finding.occurrences,
      finding.severity,
      finding.ease,
      finding.criticity,
      "", // TODO Effort for fixing vulnerability
      finding.display_status,
      "", // TODO Recurrence
      "", // TODO App release that contains the fix
      finding.ssg_responsibility ? "Y" : "N",
      "", // TODO Origin of responsibility
      finding.comment,
      finding.mitigation
    ].map(field => `"${field?.toString().replace(/["\n\r]/g, " ")}"`).join(sep)).join("\n");

  // Écriture du fichier
  await writeFile(path, data, { encoding: "utf8" });
}

/**
 * Exporte les vulnérabilités vers un fichier HTML.
 *
 * @param {{name: string}} product Produit DefectDojo
 * @param {{version: string}} engagement Engagement DefectDojo
 * @param {Array} findings Liste des vulnérabilités
 * @param {string} path Chemin vers le fichier HTML à créer
 */
export async function exportToHTML(product, engagement, findings, path) {
  // Récupération du template
  const templateFile = join(dirname(fileURLToPath(import.meta.url)), "template.ejs");
  const template = await readFile(templateFile, { encoding: "utf8" });

  // Exportation des vulnérabilités
  const html = ejs.render(template, { product, engagement, findings, headers });

  // Écriture du fichier
  await writeFile(path, html, { encoding: "utf8" });
}

/**
 * Exporte les vulnérabilités vers un fichier JSON.
 *
 * @param {{name: string}} product Produit DefectDojo
 * @param {{version: string}} engagement Engagement DefectDojo
 * @param {Array} findings Liste des vulnérabilités
 * @param {string} path Chemin vers le fichier JSON à créer
 */
export async function exportToJSON(product, engagement, findings, path) {
  const data = { product, engagement, findings };
  await writeFile(path, JSON.stringify(data), { encoding: "utf8" });
}
