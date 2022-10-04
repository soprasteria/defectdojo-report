import assert from "assert";
import { existsSync } from "fs";
import { rm, writeFile } from "fs/promises";
import { loadConfig } from "../src/config.js";

describe("config", function () {

  describe("#loadConfig()", function () {

    const tests = [
      { name: "accept a valid config", path: new URL("./data/config.json", import.meta.url) },
      { name: "accept an empty path", path: "" },
      { name: "reject a file not found", path: new URL("./data/notfound.json", import.meta.url), throws: true },
      { name: "reject an invalid property", config: { "impacts": ["only", "three", "items"] }, throws: true },
      { name: "reject an invalid matrix", config: { "criticityMatrix": [["wrong-size"]] }, throws: true },
    ];

    // Test each case
    for (const test of tests) {
      it(`should ${test.name}`, async function () {
        const path = test.path ?? new URL("./data/testconfig.json", import.meta.url);
        if (!("path" in test)) {
          // Write the test configuration
          await writeFile(path, JSON.stringify(test.config), { encoding: "utf8" });
        }
        if (test.throws) { // Error expected
          await assert.rejects(() => loadConfig(path));
        } else { // Success expected
          let config;
          await assert.doesNotReject(async () => { config = await loadConfig(path) });
          assert.notStrictEqual(config, null);
        }
      });
    }

    // Remove the test configuration
    afterEach(async function () {
      const path = new URL("./data/testconfig.json", import.meta.url);
      if (existsSync(path)) {
        await rm(path);
      }
    });

  });

});
