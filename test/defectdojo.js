import assert from "assert";
import { DefectDojoApiClient } from "../src/defectdojo.js";

const client = new DefectDojoApiClient("http://localhost:8888", "TOKEN");

describe("DefectDojoApiClient", function () {

  describe("#getProduct()", function () {
    it("should return a single product", async function () {
      let product;
      await assert.doesNotReject(async () => product = await client.getProduct("product"));
      assert.strictEqual(product.id, 1);
      assert.strictEqual(product.title, "product");
      assert.strictEqual(product.url, "http://localhost:8888/product/1");
    });
    it("should throw if the product doesn't exist", async function () {
      await assert.rejects(() => client.getProduct("unknown"));
    });
  });

  describe("#getEngagements()", function () {
    it("should return all product engagements when searching by product id", async function () {
      let engagements;
      await assert.doesNotReject(async () => engagements = await client.getEngagements(1));
      assert.strictEqual(engagements.length, 2);
      assert.strictEqual(engagements[0].id, 1);
      assert.strictEqual(engagements[0].url, "http://localhost:8888/engagement/1");
      assert.strictEqual(engagements[1].id, 2);
      assert.strictEqual(engagements[1].url, "http://localhost:8888/engagement/2");
    });
    it("should return a single engagement when searching also by name", async function () {
      let engagements;
      await assert.doesNotReject(async () => engagements = await client.getEngagements(1, "main"));
      assert.strictEqual(engagements.length, 1);
      assert.strictEqual(engagements[0].id, 1);
      assert.strictEqual(engagements[0].name, "main");
      assert.strictEqual(engagements[0].url, "http://localhost:8888/engagement/1");
    });
    it("should return no engagement if none exists with the given name", async function () {
      let engagements;
      await assert.doesNotReject(async () => engagements = await client.getEngagements(1, "unknown"));
      assert.strictEqual(engagements.length, 0);
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
