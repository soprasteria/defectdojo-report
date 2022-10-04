import assert from "assert";
import { CliError, parseArgs } from "../src/cli.js";

describe("cli", function () {

  describe("#parseArgs()", function () {

    // Some valid command-line arguments
    const url = ["--url", "http://localhost:8888"];
    const token = ["--token", "X".repeat(40)];
    const product = ["--product", "product"]
    const engagement = ["--engagement", "main"];
    const cli = [...url, ...token, ...product, ...engagement];

    const tests = [
      { name: "show the help message", cli: ["--help"], code: 0 },
      { name: "show the version number", cli: ["--version"], code: 0 },
      { name: "accept valid arguments", cli, code: null },
      { name: "require the URL", cli: [...token, ...product, ...engagement], code: 1 },
      { name: "reject an invalid URL", cli: ["--url", "invalid", ...token, ...product, ...engagement], code: 1 },
      { name: "require the token", cli: [...url, ...product, ...engagement], code: 1 },
      { name: "reject an invalid token", cli: [...url, "--token", "invalid", ...product, ...engagement], code: 1 },
      { name: "require the product", cli: [...url, ...token, ...engagement], code: 1 },
      { name: "reject an invalid product", cli: [...url, ...token, "--product", "***", ...engagement], code: 1 },
      { name: "require the engagement", cli: [...url, ...token, ...product], code: 1 },
      { name: "reject an invalid engagement", cli: [...url, ...token, ...product, "--engagement", "***"], code: 1 },
      { name: "reject an invalid config file", cli: [...cli, "--config", "./notfound.json"], code: 1 }
    ];

    // Backup original command-line arguments
    const argv = process.argv;

    // Test each case
    for (const test of tests) {
      it(`should ${test.name} for arguments ${test.cli.join(" ")}`, async function () {
        process.argv = [...argv, ...test.cli];
        if (test.code !== null) { // Error expected
          await assert.rejects(() => parseArgs(), new CliError(test.code));
        } else { // Success expected
          let opts;
          await assert.doesNotReject(async () => { opts = await parseArgs() });
          assert.strictEqual(Object.keys(opts).length, 8);
        }
      });
    }

    // Reset command-line arguments
    afterEach(function () {
      process.argv = argv;
    });

  });

});
