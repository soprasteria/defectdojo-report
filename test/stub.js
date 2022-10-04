/*
 * stub.js
 * DefectDojo API stub for end-to-end testing
 */

import { readFileSync } from "fs";
import express from "express";

const port = 8888;
const app = express();

// Load findings test data from a JSON file
const findings = JSON.parse(readFileSync(
  new URL("data/findings.json", import.meta.url),
  { encoding: "utf8" })
);

// GET /api/v2/products should return a single test product.
app.get("/api/v2/products", (req, res) => {
  if (req.query.name === "unknown") {
    res.json({ count: 0, results: [] });
    return;
  }
  res.json({
    count: 1,
    results: [
      { id: 1, name: "product", description: "Product description" }
    ]
  });
});

// GET /api/v2/engagements should return a single test engagement.
app.get("/api/v2/engagements", (req, res) => {
  if (req.query.name === "unknown") {
    res.json({ count: 0, results: [] });
    return;
  }
  res.json({
    count: 1,
    results: [
      { id: 1, name: "main" }
    ]
  });
});

// GET /api/v2/engagements should return some test findings.
app.get("/api/v2/findings", (req, res) => {
  if (req.query.test__engagement === "fatal") {
    res.sendStatus(500);
    return;
  }
  res.json({
    count: 1,
    results: findings
  });
});

/**
 * HTTP server
 */
let server;

/**
 * Start the HTTP server before running tests.
 */
export async function mochaGlobalSetup() {
  await new Promise((resolve) => {
    server = app.listen(port, () => resolve())
  });
};

/**
 * Stop the HTTP server after running tests.
 */
export async function mochaGlobalTeardown() {
  await new Promise((resolve) => server.close(() => resolve()));
}
