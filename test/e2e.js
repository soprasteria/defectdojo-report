import assert from "assert";
import { mkdir, readFile, rm } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { main } from "../src/main.js";

const outputDir = fileURLToPath(new URL("tmp", import.meta.url));
const outputFile = join(outputDir, "secdebt");
const argv = process.argv;

describe("defectdojo-report", function () {

  before(async function () {
    await mkdir(outputDir, { recursive: true });
  });

  it("should generate valid security debt reports", async function () {
    // Set command-line arguments and environment variables
    process.argv = [
      ...process.argv,
      "--url", "http://localhost:8888",
      "--product", "product",
      "--engagement", "main",
      "--status", "active,!out_of_scope",
      "--output", outputFile,
      "--format", "csv,html,json",
      "--config", fileURLToPath(new URL("data/config.json", import.meta.url))
    ];
    process.env["DEFECTDOJO_TOKEN"] = "X".repeat(40);

    // Generate security debt reports
    await assert.doesNotReject(main());

    // Read reports
    let csv, html, json;
    await assert.doesNotReject(async () => {
      csv = await readFile(`${outputFile}.csv`, { encoding: "utf8" });
      html = await readFile(`${outputFile}.html`, { encoding: "utf8" });
      json = await readFile(`${outputFile}.json`, { encoding: "utf8" });
    });

    // Check the HTML report content
    assert.ok(html.match(/<h1>Security Debt<\/h1>/));
    assert.ok(html.match(/<span>product<\/span>/));
    [
      { str: "#18aada", count: 2 }, // Custom primary color
      { str: "320px-Defectdojologo.png", count: 1 }, // Custom logo
      { str: "<tr", count: 11 }, // 11 lines (header + 10 vulnerabilities)
      { str: ">high<", count: 7 }, // 7 vulnerabilities with "High" impact/criticity
      { str: ">medium<", count: 5 }, // 5 vulnerabilities with "Medium" impact / criticity
      { str: ">low<", count: 3 }, // 3 vulnerabilities with "Low" impact
      { str: ">easy<", count: 2 }, // 2 vulnerabilities with "Easy" ease of exploitation
      { str: ">moderate<", count: 2 }, // 2 vulnerabilities with "Moderate" ease of exploitation
      { str: ">hard<", count: 2 }, // 2 vulnerabilities with "Hard" ease of exploitation
      { str: ">very hard<", count: 4 }, // 4 vulnerabilities with "Very Hard" ease of exploitation
      { str: ">critical<", count: 2 }, // 2 vulnerabilities with "Critical" criticity
      { str: ">minor<", count: 3 }, // 3 vulnerabilities with "Minor" criticity
      { str: ">Y<", count: 3 }, // 3 vulnerabilities that must be fixed by the service provider
      { str: ">N<", count: 7 } // 7 vulnerabilities that must be fixed by the owner
    ].forEach(({ str, count }) => {
      assert.strictEqual(html.match(new RegExp(str, "g"))?.length, count, `Invalid '${str}' count`);
    });

    // Check the JSON report content
    const jsonReport = JSON.parse(json);
    assert.strictEqual(jsonReport.products?.length, 1);
    assert.strictEqual(jsonReport.engagements?.length, 1);
    assert.strictEqual(jsonReport.findings?.length, 10);

    // Check the CSV report content
    assert.strictEqual(csv.match(/\n/g).length, 10);
  });

  after(async function () {
    process.argv = argv; // Reset command-line arguments
    await rm(outputDir, { recursive: true }); // Remove reports
  });

});
