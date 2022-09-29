/*
 * defectdojo.js
 * DefectDojo API V2 query service
 */

import fetch from "node-fetch";

/**
 * DefectDojo API V2 query client.
 * In case of error, methods log an error message and exit the process.
 */
export class DefectDojoApiClient {

  /**
   * Initialise a new DefectDojo API V2 query client.
   *
   * @param {string} url Root URL of the DefectDojo instance
   * @param {string} token Authentication key for the API V2
   */
  constructor(url, token) {
    this.url = url.replace(/\/$/, "");
    this.apiUrl = this.url + "/api/v2";
    this.options = { "headers": { "Authorization": `Token ${token}` } };
  }

  /**
   * Fetch a product by name.
   *
   * @param {string} name product name
   * @returns The product
   */
  async getProduct(name) {
    console.log(`[info] Fetching product '${name}'`)
    try {
      const response = await fetch(`${this.apiUrl}/products?name=${name}`, this.options);
      const data = await response.json();
      if (data.count != 1) {
        console.error("[error] Expected to find a single product");
        process.exit(1);
      }
      const product = data.results[0];
      product.title = product.description || product.name;
      product.url = `${this.url}/product/${product.id}`;
      console.log(`[info] Product id = ${product.id}`);
      return product;
    } catch (error) {
      console.error("[error] An error occurred fetching products:", error);
      process.exit(1);
    }
  }

  /**
   * Fetch an engagement by product and by name.
   *
   * @param {string} productId Product id
   * @param {string} name Engagement name
   * @returns The engagement
   */
  async getEngagement(productId, name) {
    console.log(`[info] Fetching engagement '${name}' for product id '${productId}'`);
    try {
      const response = await fetch(`${this.apiUrl}/engagements?product=${productId}&name=${name}`, this.options);
      const data = await response.json();
      if (data.count != 1) {
        console.error("[error] Expected to find a single engagement");
        process.exit(1);
      }
      const engagement = data.results[0];
      engagement.url = `${this.url}/engagement/${engagement.id}`;
      console.log(`[info] Engagement id = ${engagement.id}`);
      return engagement;
    } catch (error) {
      console.error("[error] An error occurred fetching engagements:", error);
      process.exit(1);
    }
  }

  /**
   * Fetch vulnerabilities associated to one or multiple engagements.
   *
   * @param {string[]} engagements Engagements ids
   * @param {string[]} statuses Statuses to filter
   * @returns Vulnerabilities
   */
  async getFindings(engagements, statuses) {
    console.log(`[info] Fetching findings for engagement(s) ${engagements.join(", ")}`);
    try {
      const filters = statuses.map(s => s[0] !== "!" ? s + "=true" : s.slice(1) + "=false").join("&");
      let findingsUrl = `${this.apiUrl}/findings?test__engagement=${engagements.join(",")}`
        + `&limit=100&${filters}&related_fields=true`;
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
