"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const { analyzePreProduct } = require("../analysis/preProductAnalyzer");
const multiProductIdeas = require("../data/mock/multiProductIdeas.sg.json");
const multiProductCompetitors = require("../data/mock/multiProductCompetitors.sg.json");
const phoneCaseProductIdea = require("../data/mock/phoneCaseProductIdea.sg.json");
const phoneCaseCompetitors = require("../data/mock/phoneCaseCompetitors.sg.json");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const DASHBOARD_DIR = path.join(__dirname, "..", "dashboard");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && url.pathname === "/api/mock-catalog") {
      return sendJson(response, {
        target_region: "SG",
        data_mode: "mock",
        sample_products: [phoneCaseProductIdea, ...multiProductIdeas],
        competitor_count: phoneCaseCompetitors.length + multiProductCompetitors.length
      });
    }

    if (request.method === "POST" && url.pathname === "/api/analyze") {
      const body = await readJsonBody(request);
      const categoryPath = body.productIdea?.taxonomy?.category_path || [];
      const competitors = chooseCompetitors(categoryPath);
      const report = analyzePreProduct({
        productIdea: body.productIdea,
        competitors
      });

      return sendJson(response, {
        data_mode: "mock",
        target_region: body.productIdea?.fulfillment?.target_region || "SG",
        competitor_source: "Shopee-style mock marketplace data",
        agent_response: report
      });
    }

    if (request.method !== "GET") {
      response.writeHead(405);
      return response.end("Method not allowed");
    }

    const filePath = staticFilePath(url.pathname);
    if (!filePath || !filePath.startsWith(DASHBOARD_DIR)) {
      response.writeHead(404);
      return response.end("Not found");
    }

    fs.readFile(filePath, (error, file) => {
      if (error) {
        response.writeHead(404);
        return response.end("Not found");
      }

      response.writeHead(200, {
        "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream"
      });
      response.end(file);
    });
  } catch (error) {
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AdaptLink dashboard running at http://${HOST}:${PORT}`);
});

function staticFilePath(pathname) {
  const cleanPath = pathname === "/" ? "/index.html" : pathname;
  return path.normalize(path.join(DASHBOARD_DIR, cleanPath));
}

function chooseCompetitors(categoryPath) {
  const key = categoryPath.join(" > ");
  if (key.includes("Cases Covers")) return phoneCaseCompetitors;
  if (key.includes("Water Bottles")) {
    return multiProductCompetitors.filter((item) => item.taxonomy?.category_path?.join(" > ").includes("Water Bottles"));
  }
  if (key.includes("T-Shirts")) {
    return multiProductCompetitors.filter((item) => item.taxonomy?.category_path?.join(" > ").includes("T-Shirts"));
  }
  return [...phoneCaseCompetitors, ...multiProductCompetitors];
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, payload) {
  response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
