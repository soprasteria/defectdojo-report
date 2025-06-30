import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig } from "../src/config.js";

describe("config", function () {

  describe("#loadConfig()", function () {

    const tests = [
      { name: "accept a valid config", path: join(import.meta.dirname, "data/config.json") },
      { name: "accept an empty path", path: "" },
      { name: "reject a file not found", path: join(import.meta.dirname, "data/notfound.json"), throws: true },
      { name: "reject an invalid property", config: { "impacts": ["only", "three", "items"] }, throws: true },
      { name: "reject an invalid matrix", config: { "criticityMatrix": [["wrong-size"]] }, throws: true },
    ];

    // Test each case
    for (const test of tests) {
      it(`should ${test.name}`, async function () {
        const path = test.path ?? join(import.meta.dirname, "data/testconfig.json");
        if (!("path" in test)) {
          // Write the test configuration
          await writeFile(path, JSON.stringify(test.config), { encoding: "utf8" });
        }
        if (test.throws) { // Error expected
          await assert.rejects(() => loadConfig(path));
        } else { // Success expected
          let config;
          await assert.doesNotReject(async () => {
            config = await loadConfig(path);
          });
          assert.notEqual(config, null);
        }
      });
    }

    // Remove the test configuration
    afterEach(async function () {
      const path = join(import.meta.dirname, "data/testconfig.json");
      if (existsSync(path)) {
        await rm(path);
      }
    });

  });

});
