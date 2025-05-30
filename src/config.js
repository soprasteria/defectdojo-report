/*
 * config.js
 * Tool configuration service
 */

import { readFile } from "fs/promises";
import { JSONPath } from "jsonpath-plus";

/**
 * Default tool configuration
 */
const defaultConfig = {
  // DefectDojo tag indicating that the vulnerability fix is under the service provider responsibility
  serviceProviderTag: "sp",
  // DefectDojo tags indicating the ease of exploitation (contextualised) of a vulnerability
  easeTags: ["e0", "e1", "e2", "e3", "e4"],
  // DefectDojo tags indicating the audit origin
  originTags: ["init", "initial", "run", "alert", "reversibility"],
  // Impact/severity levels (cf. "severity" field of the vulnerability in DefectDojo)
  impacts: ["informational", "low", "medium", "high", "critical"],
  // Ease of exploitation levels associated to the tags
  eases: ["undefined", "very hard", "hard", "moderate", "easy"],
  // Resultant criticity levels
  criticities: ["undefined", "minor", "medium", "high", "critical"],
  // Matrix allowing to get the resultant criticity from the impact (x) and the ease of exploitation (y)
  criticityMatrix: [
    [1, 1, 2, 2], // minor   minor   medium    medium
    [1, 2, 3, 3], // minor   medium  high      high
    [2, 2, 3, 4], // medium  medium  high      critical
    [3, 3, 4, 4]  // high    high    critical  critical
  ],
  // HTML report title
  title: "Security Debt",
  // Logo to display in the HTML report (URL or data:image/{type};base64,{base64})
  logo: null,
  // Primary color used in the HTML report
  primaryColor: "#d31900",
  // Colors associated to each impact, ease of exploitation and criticity level
  criticityColors: ["#eeeeee", "#ffd740", "#ff9c40", "#ff5252", "#b870ff"],
  // Report fields ("header": "JSONPath")
  fields: {
    "Application": "$.product.name", // Application name or id
    "Audit origin": "$.origin", // Initial, Run, Alert, Reversibility
    "Detection date": "$.date",
    "Application version": "$.engagement.version", // X.Y.Z or GOROCO
    "Security tool": "$.tool", // Dependency-Check, SonarQube, ZAP, Checkmarx, Manual or Others
    "Tool or pattern version": "", // TODO Tool (or pattern) version
    "Location": "$.file_path", // Class or file name
    "Title": "$.title", // from the security tools of alert bulleting
    "Occurrences": "$.occurrences",
    "Impact": "SEVERITY", // Audit vision
    "Ease of exploitation": "EASE",
    "Resultant criticity": "CRITICITY",
    "Remediation effort": "$.effort_for_fixing", // Effort for fixing vulnerability (Low, Medium or High)
    "Status": "$.display_status", // Open, Analyzed, Waiting, Planned, Processed, Cancelled or Duplicate
    "Recurrence": "", // TODO Recurrence (New, Recurrent, Fixed or Duplicate)
    "Fixed application version": "$.planned_remediation_version", // App release that contains the fix (if planned or processed)
    "Service provider responsibility": "$.sp_responsibility", // Y/N
    "Responsibility origin": "", // TODO Origin of responsibility (Framework, third-party code, detected in the beginning of the project)
    "Comments": "$.comment",
    "Mitigation": "$.mitigation"
  }
};

/**
 * Load and validate the tool configuration.
 *
 * @param {string} path Path to the configuration customisation JSON file
 * @returns {Promise<*>} The tool configuration
 * @throws Invalid configuration
 */
export async function loadConfig(path) {
  const config = Object.assign({}, defaultConfig);
  if (!path) {
    return config
  }
  // Load the custom configuration
  console.log("[info] Loading custom configuration");
  let cc;
  try {
    cc = JSON.parse(await readFile(path, { encoding: "utf8" }));
  } catch (error) {
    throw new Error(`Unable to load or parse configuration from '${path}' (${error?.message ?? error})`);
  }
  // Validate properties
  for (const prop of ["easeTags", "originTags", "impacts",
    "eases", "criticities", "criticityColors"]) {
    if (prop in cc && (!Array.isArray(cc[prop]) || cc[prop]?.length !== 5)) {
      throw new Error(`Configuration property '${prop}' is invalid`);
    }
  }
  if ("criticityMatrix" in cc && cc.criticityMatrix && (!Array.isArray(cc.criticityMatrix) ||
    cc.criticityMatrix.length !== 4 || cc.criticityMatrix.some(row => !Array.isArray(row) ||
      row.length !== 4 || row.some(col => !Number.isFinite(col) || col < 0 || col > 4)))) {
    throw new Error("Configuration property 'criticityMatrix' is invalid");
  }
  return Object.assign(config, cc);
}

/**
 * Get the field at the given path in the vulnerability data.
 *
 * @param {*} finding Vulnerability data
 * @param {string} path Path to the field to get (JSONPath ou special field)
 * @returns {{value: string, type: string, index?: number}} Value, type and index
 */
export function resolveField(finding, path) {
  if (!path) {
    return { value: "", type: "string" };
  }
  // Special fields
  if (["severity", "ease", "criticity"].some(f => path === f.toUpperCase())) {
    const f = path.toLowerCase();
    return { value: finding[f], type: "criticity", index: finding[`${f}_index`] };
  }
  // JSONPath
  let value = JSONPath({ path, json: finding });
  // Normalisation
  if (Array.isArray(value)) value = value.length > 0 ? value[0] : "";
  if (value === undefined || value === null) value = "";
  if (typeof value == "object") value = value.toString();
  if (typeof value == "string") value = value.trim();
  let type = "string";
  // Boolean handling
  if (typeof value == "boolean" || value === "true" || value === "false") {
    type = "boolean";
    value = value === true || value === "true";
  }
  return { value, type };
}
