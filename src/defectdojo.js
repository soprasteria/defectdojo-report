/*
 * defectdojo.js
 * Service d'interrogation de l'API V2 de DefectDojo.
 */

import fetch from "node-fetch";

/**
 * Client d'interrogation de l'API V2 de DefectDojo.
 * En cas d'erreur, toutes les méthodes journalisent un message d'erreur
 * et terminent le processus.
 */
export class DefectDojoApiClient {

  /**
   * Initialise un nouveau client d'interrogation de l'API V2 de DefectDojo.
   *
   * @param {string} url URL racine de l'instance
   * @param {string} token Jeton d'authentification auprès de l'API V2
   */
  constructor(url, token) {
    this.url = new URL("/api/v2", url).toString();
    this.options = { "headers": { "Authorization": `Token ${token}` } };
  }

  /**
   * Récupère un produit par nom.
   *
   * @param {string} name Nom du produit
   * @returns Le produit
   */
  async getProduct(name) {
    console.log(`[info] Fetching product '${name}'`)
    try {
      const response = await fetch(`${this.url}/products?name=${name}`, this.options);
      const data = await response.json();
      if (data.count != 1) {
        console.error("[error] Expected to find a single product");
        process.exit(1);
      }
      const product = data.results[0];
      console.log(`[info] Product id = ${product.id}`);
      return product;
    } catch (error) {
      console.error("[error] An error occurred fetching products:", error);
      process.exit(1);
    }
  }

  /**
   * Récupère un engagement par produit et par nom.
   *
   * @param {string} productId Identifiant du produit
   * @param {string} name Nom de l'engagement
   * @returns L'engagement
   */
  async getEngagement(productId, name) {
    console.log(`[info] Fetching engagement '${name}' for product id '${productId}'`);
    try {
      const response = await fetch(`${this.url}/engagements?product=${productId}&name=${name}`, this.options);
      const data = await response.json();
      if (data.count != 1) {
        console.error("[error] Expected to find a single engagement");
        process.exit(1);
      }
      const engagement = data.results[0];
      console.log(`[info] Engagement id = ${engagement.id}`);
      return engagement;
    } catch (error) {
      console.error("[error] An error occurred fetching engagements:", error);
      process.exit(1);
    }
  }

  /**
   * Récupère la liste des vulnérabilités associées à un engagement donné.
   *
   * @param {string} engagementId Identifiant de l'engagement
   * @param {string[]} statuses Statuts à filtrer
   * @returns Les vulnérabilités
   */
  async getFindings(engagementId, statuses) {
    console.log(`[info] Fetching findings for engagement id '${engagementId}'`);
    try {
      const filters = statuses.map(s => s[0] !== "!" ? s + "=true" : s.slice(1) + "=false").join("&");
      let findingsUrl = `${this.url}/findings?test__engagement=${engagementId}&limit=100&${filters}&related_fields=true`;
      const findings = [];
      let findingsPage = 0;
      while (findingsUrl && findingsPage < 20) {
        console.log(`[info] Fetching findings (page ${findingsPage}): ${findingsUrl}`);
        let findingsResponse = await fetch(findingsUrl, this.options);
        let findingsData = await findingsResponse.json();
        findings.push(...findingsData.results);
        findingsUrl = findingsData.next;
        findingsPage++;
      }
      console.log(`[info] Findings count = ${findings.length}`);
      return findings;
    } catch (error) {
      console.error("[error] An error occurred fetching findings:", error);
      process.exit(1);
    }
  }

}
