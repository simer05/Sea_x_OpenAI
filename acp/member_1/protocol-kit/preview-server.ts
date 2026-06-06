import { createServer, type ServerResponse } from "node:http";
import {
  buildBaseProductFixtures,
  buildProductExtensionBundles,
  buildProtocolValidationSuitePayloads,
  catalogRows,
  sellers
} from "./fixtures/load-fixtures";
import { buildSamplePayloads } from "./sample-payloads";
import { runProtocolValidationSuite } from "./validators";

const port = Number(process.env.PORT ?? 4177);

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(json);
}

function fixtureSummary() {
  return {
    sellers: sellers.length,
    skus: catalogRows.length,
    currencies: [...new Set(catalogRows.map((row) => row.currency))],
    countries: [...new Set(catalogRows.map((row) => row.country))],
    cities: [...new Set(catalogRows.map((row) => row.city))],
    halal_certified_beauty_skus: catalogRows.filter(
      (row) => row.category === "beauty" && row.halal_status === "certified"
    ).length,
    bpom_registered_beauty_skus: catalogRows.filter(
      (row) => row.category === "beauty" && row.bpom_status === "registered"
    ).length,
    cod_eligible_jakarta_skus: catalogRows.filter(
      (row) => row.city === "Jakarta" && row.cod_available
    ).length,
    bnpl_eligible_skus: catalogRows.filter((row) => row.bnpl_available).length,
    non_cod_skus: catalogRows.filter((row) => !row.cod_available).length,
    unknown_halal_skus: catalogRows.filter((row) => row.halal_status === "unknown").length
  };
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `localhost:${port}`}`);

  if (url.pathname === "/" || url.pathname === "/health") {
    const validation = runProtocolValidationSuite(buildProtocolValidationSuitePayloads());
    sendJson(res, 200, {
      service: "ACP-SEA Bridge Protocol Kit preview",
      scope: "Member 1 protocol validation only. No marketplace runtime or demo UI.",
      valid: validation.valid,
      endpoints: [
        "/validation-suite",
        "/fixtures/summary",
        "/sample-payloads",
        "/base-products",
        "/extension-bundles"
      ],
      messages: validation.messages
    });
    return;
  }

  if (url.pathname === "/validation-suite") {
    sendJson(res, 200, runProtocolValidationSuite(buildProtocolValidationSuitePayloads()));
    return;
  }

  if (url.pathname === "/fixtures/summary") {
    sendJson(res, 200, fixtureSummary());
    return;
  }

  if (url.pathname === "/sample-payloads") {
    sendJson(res, 200, buildSamplePayloads());
    return;
  }

  if (url.pathname === "/base-products") {
    sendJson(res, 200, buildBaseProductFixtures());
    return;
  }

  if (url.pathname === "/extension-bundles") {
    sendJson(res, 200, buildProductExtensionBundles());
    return;
  }

  sendJson(res, 404, {
    error: "Not found",
    endpoints: ["/", "/validation-suite", "/fixtures/summary", "/sample-payloads"]
  });
});

server.listen(port, () => {
  console.log(`ACP-SEA Protocol Kit preview running at http://localhost:${port}`);
});
