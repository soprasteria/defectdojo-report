import assert from "assert";
import { DefectDojoApiClient } from "../src/defectdojo.js";

const client = new DefectDojoApiClient("http://localhost:8888", "TOKEN");

describe("DefectDojoApiClient", function () {

  describe("#getProduct()", function () {
    it("should return a single product", async function () {
      let product;
      await assert.doesNotReject(async () => product = await client.getProduct("product"));
      assert.strictEqual(product.id, 1);
      assert.strictEqual(product.title, "Product description");
      assert.strictEqual(product.url, "http://localhost:8888/product/1");
    });
    it("should throw if the product doesn't exist", async function () {
      await assert.rejects(() => client.getProduct("unknown"));
    });
  });

  describe("#getEngagement()", function () {
    it("should return a single engagement", async function () {
      let engagement;
      await assert.doesNotReject(async () => engagement = await client.getEngagement(1, "main"));
      assert.strictEqual(engagement.id, 1);
      assert.strictEqual(engagement.url, "http://localhost:8888/engagement/1");
    });
    it("should throw if the engagement doesn't exist", async function () {
      await assert.rejects(() => client.getEngagement(1, "unknown"));
    });
  });

  describe("#getFindings()", function () {
    it("should return findings", async function () {
      let findings;
      await assert.doesNotReject(async () => findings = await client.getFindings([], []));
      assert.strictEqual(10, findings.length);
    });
    it("should throw if something went wrong", async function () {
      await assert.rejects(() => client.getFindings(["fatal"], []));
    });
  });

});
