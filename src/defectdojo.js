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
      product.title = product.description || product.name;
      product.url = `${this.url}/product/${product.id}`;
      console.log(`[info] Product id = ${product.id}`);
      return product;
    } catch (error) {
      throw new Error(`An error occurred fetching products: ${error?.message ?? error}`);
    }
  }

  /**
   * Fetch an engagement by product and by name.
   *
   * @param {string} productId Product id
   * @param {string} name Engagement name
   * @returns The engagement
   * @throws Request error
   */
  async getEngagement(productId, name) {
    console.log(`[info] Fetching engagement '${name}' for product id '${productId}'`);
    try {
      const response = await this.http.get(`/engagements?product=${productId}&name=${name}`);
      const results = response.data?.results?.filter(e => e.name === name); // Exact match
      if (results?.length !== 1) {
        throw new Error("expected to find a single engagement");
      }
      const engagement = results[0];
      engagement.url = `${this.url}/engagement/${engagement.id}`;
      console.log(`[info] Engagement id = ${engagement.id}`);
      return engagement;
    } catch (error) {
      throw new Error(`An error occurred fetching engagements: ${error?.message ?? error}`);
    }
  }

  /**
   * Fetch vulnerabilities associated to one or multiple products
   * and engagements.
   *
   * @param {string[]} products Products ids
   * @param {string[]} engagements Engagements ids (optional)
   * @param {string[]} statuses Statuses to filter
   * @returns Vulnerabilities
   * @throws Request error
   */
  async getFindings(products, engagements, statuses) {
    console.log(`[info] Fetching findings for product(s) [${products.join(", ")}]`
      + ` and engagement(s) [${engagements.join(", ")}]`);
    try {
      const query = [];
      query.push(`test__engagement__product=${products.join(",")}`);
      if (engagements?.length > 0) {
        query.push(`test__engagement=${engagements.join(",")}`);
      }
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
