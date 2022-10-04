/*
 * exports.js
 * Security debt report export service
 */

import { dirname, join } from "path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import ejs from "ejs";
import { resolveField } from "./config.js";

/**
 * Export vulnerabilities to a CSV file.
 *
 * @param {Array<*>} _products DefectDojo products (unused)
 * @param {Array<*>} _engagements DefectDojo engagements (unused)
 * @param {Array<*>} findings Vulnerabilities
 * @param {string} path Path to the CSV file to create
 * @param {*} config Configuration
 * @param {{separator: string}} options CSV export options
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
 * Export vulnerabilities to an HTML file.
 *
 * @param {Array<*>} products DefectDojo products
 * @param {Array<*>} engagements DefectDojo engagements
 * @param {Array<*>} findings Vulnerabilities
 * @param {string} path Path to the HTML file to create
 * @param {*} config Configuration
 */
export async function exportToHTML(products, engagements, findings, path, config) {
  // Load the template
  const templateFile = join(dirname(fileURLToPath(import.meta.url)), "template.ejs");
  const template = await readFile(templateFile, { encoding: "utf8" });

  // Export vulnerabilities
  const headers = Object.keys(config.fields);
  const findingsFields = findings.map(finding => Object.values(config.fields)
    .map(f => resolveField(finding, f)));
  const html = ejs.render(template, {
    config, products, engagements,
    findings: findingsFields, headers
  });

  // Write the output file
  await writeFile(path, html, { encoding: "utf8" });
}

/**
 * Export vulnerabilities to a JSON file.
 *
 * @param {Array<*>} products DefectDojo products
 * @param {Array<*>} engagements DefectDojo engagements
 * @param {Array<*>} findings Vulnerabilities
 * @param {string} path Path to the JSON file to create
 */
export async function exportToJSON(products, engagements, findings, path) {
  const data = { products, engagements, findings };
  await writeFile(path, JSON.stringify(data), { encoding: "utf8" });
}
