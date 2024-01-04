/*
 * defectdojo.js
 * DefectDojo API V2 query service
 */

import axios from "axios";

/**
 * DefectDojo API V2 query client.
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
    this.http = axios.create({
      baseURL: `${this.url}/api/v2`,
      headers: { "Authorization": `Token ${token}` }
    });
  }

  /**
   * Fetch a product by name.
   *
   * @param {string} name product name
   * @returns The product
   * @throws Request error
   */
  async getProduct(name) {
    console.log(`[info] Fetching product '${name}'`)
    try {
      const response = await this.http.get(`/products?name=${name}`);
      const results = response.data?.results?.filter(p => p.name === name); // Exact match
      if (results?.length !== 1) {
        throw new Error("expected to find a single product");
      }
      const product = results[0];
      const d = product.description?.trim();
      product.title = d && d.length < 60 && !d.includes("\n") ? d : product.name;
      product.url = `${this.url}/product/${product.id}`;
      console.log(`[info] Product id = ${product.id}`);
      return product;
    } catch (error) {
      throw new Error(`An error occurred fetching products: ${error?.message ?? error}`);
    }
  }

  /**
   * Fetch engagements by product and name.
   *
   * @param {string} productId Product id
   * @param {string} name Engagement name (optional)
   * @returns Engagements
   * @throws Request error
   */
  async getEngagements(productId, name) {
    console.log(`[info] Fetching engagement${name ? ` '${name}'` : 's'} for product id '${productId}'`);
    try {
      const query = [];
      query.push(`product=${productId}`);
      if (name) query.push(`name=${name}`);
      query.push("o=-updated", "limit=100");
      const response = await this.http.get("/engagements?" + query.join("&"));
      const engagements = response.data?.results
        ?.filter(e => !name || e.name === name) // Exact match
        ?.map(e => ({ ...e, url: `${this.url}/engagement/${e.id}` }))
        ?? [];
      console.log(`[info] Engagements count = ${engagements.length}`);
      return engagements;
    } catch (error) {
      throw new Error(`An error occurred fetching engagements: ${error?.message ?? error}`);
    }
  }

  /**
   * Fetch vulnerabilities associated to one or multiple engagements.
   *
   * @param {string[]} engagements Engagements ids
   * @param {string[]} statuses Statuses to filter
   * @returns Vulnerabilities
   * @throws Request error
   */
  async getFindings(engagements, statuses) {
    console.log(`[info] Fetching findings for engagement(s) [${engagements.join(", ")}]`);
    try {
      const query = [];
      query.push(`test__engagement=${engagements.join(",")}`);
      query.push(...statuses.map(s => s[0] !== "!" ? s + "=true" : s.slice(1) + "=false"));
      query.push("limit=100", "related_fields=true");
      let findingsUrl = "/findings?" + query.join("&");
      const findings = [];
      let findingsPage = 0;
      while (findingsUrl && findingsPage < 100) {
        console.log(`[info] Fetching findings (page ${findingsPage}): ${findingsUrl}`);
        let findingsResponse = await this.http.get(findingsUrl);
        let findingsData = findingsResponse.data;
        findings.push(...findingsData.results);
        findingsUrl = findingsData.next;
        findingsPage++;
      }
      console.log(`[info] Findings count = ${findings.length}`);
      return findings;
    } catch (error) {
      throw new Error(`An error occurred fetching findings: ${error?.message ?? error}`);
    }
  }

}
