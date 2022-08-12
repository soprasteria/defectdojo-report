/*
 * config.js
 * Service de gestion de la configuration de l'outil
 */

import { readFile } from "fs/promises";
import { JSONPath } from "jsonpath-plus";

/**
 * Configuration par défaut de l'outil
 */
const defaultConfig = {
  // Étiquette DefectDojo indiquant que la correction de la vulnérabilité est à la charge du prestataire de service
  serviceProviderTag: "sp",
  // Étiquettes DefectDojo indiquant la facilité d'exploitation (contextualisée) d'une vulnérabilité
  easeTags: ["e0", "e1", "e2", "e3", "e4"],
  // Étiquettes DefectDojo indiquant l'origine de l'audit
  originTags: ["init", "initial", "run", "alert", "reversibility"],
  // Niveaux d'impact / de sévérité (cf. champ "severity" de la vulnérabilité dans DefectDojo)
  impacts: ["informational", "low", "medium", "high", "critical"],
  // Niveaux de facilité d'exploitation correspondant aux étiquettes
  eases: ["undefined", "very hard", "hard", "moderate", "easy"],
  // Niveau de criticité résultante
  criticities: ["undefined", "minor", "medium", "high", "critical"],
  // Matrice permettant d'obtenir la criticité résultante à partir de l'impact (x) et de la facilité d'exploitation (y)
  criticityMatrix: [
    [1, 1, 2, 2], // minor   minor   medium    medium
    [1, 2, 3, 3], // minor   medium  high      high
    [2, 2, 3, 4], // medium  medium  high      critical
    [3, 3, 4, 4]  // high    high    critical  critical
  ],
  // Titre du rapport HTML
  title: "Security Debt",
  // Logo à utiliser dans le rapport HTML (URL ou data:image/{type};base64,{base64})
  logo: null,
  // Couleur principale utilisée dans le rapport HTML
  primaryColor: "#d31900",
  // Couleurs utilisées pour les différents niveaux d'impact, de facilité d'exploitation et de criticité
  criticityColors: ["#eeeeee", "#ffd740", "#ff9c40", "#ff5252", "#b870ff"],
  // Champs ("header": "JSONPath")
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
    "Remediation effort": "", // TODO Effort for fixing vulnerability (Low, Medium or High)
    "Status": "$.display_status", // Open, Analyzed, Waiting, Planned, Processed, Cancelled or Duplicate
    "Recurrence": "", // TODO Recurrence (New, Recurrent, Fixed or Duplicate)
    "Fixed application version": "", // TODO App release that contains the fix (if planned or processed)
    "Service provider responsibility": "$.sp_responsibility", // Y/N
    "Responsibility origin": "", // TODO Origin of responsibility (Framework, third-party code, detected in the beginning of the project)
    "Comments": "$.comment",
    "Mitigation": "$.mitigation"
  }
};

/**
 * Charge et valide la configuration de l'outil.
 *
 * @param {string} path Chemin vers le fichier JSON de personnalisation
 * de la configuration
 * @returns {*} La configuration de l'outil
 */
export async function loadConfig(path) {
  const config = Object.assign({}, defaultConfig);
  if (!path) {
    return config
  }
  // Chargement de la configuration personnalisée
  console.log("[info] Loading custom configuration");
  let cc;
  try {
    cc = JSON.parse(await readFile(path, { encoding: "utf8" }));
  } catch (error) {
    console.error(`[error] Unable to load or parse configuration from '${path}' (${error})`);
    process.exit(1);
  }
  // Validation des propriétés
  for (const prop of ["easeTags", "originTags", "impacts",
    "eases", "criticities", "criticityColors"]) {
    if (prop in cc && (!Array.isArray(cc[prop]) || cc[prop]?.length !== 5)) {
      console.error(`[error] Configuration property '${prop}' is invalid`);
      process.exit(1);
    }
  }
  if ("criticityMatrix" in cc && cc.criticityMatrix && (!Array.isArray(cc.criticityMatrix) ||
    cc.criticityMatrix.length !== 4 || cc.criticityMatrix.some(row => !Array.isArray(row) ||
      row.length !== 4 || row.some(col => !Number.isFinite(col) || col < 0 || col > 4)))) {
    console.error(`[error] Configuration property 'criticityMatrix' is invalid`);
    process.exit(1);
  }
  return Object.assign(config, cc);
}

/**
 * Récupère le champ ciblé par le chemin fourni dans les données
 * de la vulnérabilité.
 *
 * @param {*} finding Données de la vulnérabilité
 * @param {string} path Chemin vers le champ à récupérer (JSONPath ou champ spécial)
 * @returns {{value: string, type: string, index?: number}} Valeur, type et éventuel index
 */
export function resolveField(finding, path) {
  if (!path) {
    return { value: "", type: "string" };
  }
  // Champs spéciaux
  if (["severity", "ease", "criticity"].some(f => path === f.toUpperCase())) {
    const f = path.toLowerCase();
    return { value: finding[f], type: "criticity", index: finding[`${f}_index`] };
  }
  // JSONPath
  let value = JSONPath(path, finding);
  // Normalisation
  if (Array.isArray(value)) value = value[0];
  if (typeof value == "object") value = value?.toString() ?? "";
  if (typeof value == "string") value = value?.trim();
  let type = "string";
  // Gestion des booléens
  if (typeof value == "boolean" || value === "true" || value === "false") {
    type = "boolean";
    value = value === true || value == "true" ? true : false;
  }
  return { value, type };
}
