import type {
  Endpoint,
  Field,
  Finding,
  Mutation,
  ParsedAPI,
  ScanReport,
} from "@/types";

type TestResult = {
  endpoint: Endpoint;
  mutation: Mutation;
  request: Finding["request"];
  response: Finding["response"];
  curlCommand: string;
};

export async function runFullScan(
  parsed: ParsedAPI,
  baseUrl: string
): Promise<ScanReport> {
  const findings: Finding[] = [];

  for (const endpoint of parsed.endpoints) {
    const mutations = generateMutations(endpoint);

    for (const mutation of mutations) {
      const result = await runMutation(baseUrl, endpoint, mutation);
      const finding = classifyResult(result);

      if (finding) {
        findings.push(finding);
      }
    }
  }

  return {
    baseUrl,
    totalEndpoints: parsed.endpoints.length,
    totalFindings: findings.length,
    findings,
  };
}

function generateMutations(endpoint: Endpoint): Mutation[] {
  const mutations: Mutation[] = [];

  for (const field of endpoint.fields) {
    if (field.type === "string") {
      mutations.push(
        makeMutation(field, "", "boundary", `Sending empty string for ${field.name}`),
        makeMutation(field, " ", "boundary", `Sending only spaces for ${field.name}`),
        makeMutation(
          field,
          "a".repeat(1000),
          "boundary",
          `Sending extremely large string for ${field.name}`
        ),
        makeMutation(field, 123, "wrong_type", `Sending number instead of string for ${field.name}`),
        makeMutation(field, true, "wrong_type", `Sending boolean instead of string for ${field.name}`),
        makeMutation(field, null, "wrong_type", `Sending null instead of string for ${field.name}`),
        makeMutation(field, "<script>alert(1)</script>", "injection", `Sending XSS payload for ${field.name}`),
        makeMutation(field, "' OR 1=1 --", "injection", `Sending SQL injection for ${field.name}`)
      );
    }

    if (field.type === "integer" || field.type === "number") {
      mutations.push(
        makeMutation(field, -1, "boundary", `Sending negative number for ${field.name}`),
        makeMutation(field, Number.MAX_SAFE_INTEGER, "boundary", `Sending very large number for ${field.name}`),
        makeMutation(field, "123", "wrong_type", `Sending string instead of number for ${field.name}`),
        makeMutation(field, true, "wrong_type", `Sending boolean instead of number for ${field.name}`),
        makeMutation(field, "1; DROP TABLE users", "injection", `Sending SQL injection for ${field.name}`)
      );
    }

    if (field.type === "boolean") {
      mutations.push(
        makeMutation(field, "true", "wrong_type", `Sending string instead of boolean for ${field.name}`),
        makeMutation(field, 1, "wrong_type", `Sending number instead of boolean for ${field.name}`),
        makeMutation(field, null, "wrong_type", `Sending null instead of boolean for ${field.name}`)
      );
    }

    if (field.type === "array") {
      mutations.push(
        makeMutation(field, [], "boundary", `Sending empty array for ${field.name}`),
        makeMutation(field, new Array(100).fill("a"), "boundary", `Sending very large array for ${field.name}`),
        makeMutation(field, {}, "wrong_type", `Sending object instead of array for ${field.name}`),
        makeMutation(field, ["<script>alert(1)</script>"], "injection", `Sending XSS array payload for ${field.name}`)
      );
    }

    if (field.type === "object") {
      mutations.push(
        makeMutation(field, null, "wrong_type", `Sending null instead of object for ${field.name}`),
        makeMutation(field, "{}", "wrong_type", `Sending string instead of object for ${field.name}`)
      );
    }

    if (field.required) {
      mutations.push(
        makeMutation(
          field,
          undefined,
          "missing",
          `Missing required field '${field.name}'`
        )
      );
    }
  }

  return mutations;
}

function makeMutation(
  field: Field,
  attackValue: unknown,
  attackCategory: Mutation["attackCategory"],
  description: string
): Mutation {
  return {
    fieldName: field.name,
    originalType: field.type,
    attackValue,
    attackCategory,
    description,
  };
}

async function runMutation(
  baseUrl: string,
  endpoint: Endpoint,
  mutation: Mutation
): Promise<TestResult> {
  const url = buildUrl(baseUrl, endpoint.path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const body: Record<string, unknown> = {};

  for (const field of endpoint.fields) {
    body[field.name] = getDefaultValue(field);
  }

  if (mutation.attackCategory === "missing") {
    delete body[mutation.fieldName];
  } else {
    body[mutation.fieldName] = mutation.attackValue;
  }

  let finalUrl = url;
  const requestInit: RequestInit = {
    method: endpoint.method,
    headers,
  };

  if (endpoint.method === "GET") {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) {
        continue;
      }

      query.append(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value)
      );
    }

    const queryString = query.toString();
    if (queryString) {
      finalUrl = `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
    }
  } else {
    requestInit.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  requestInit.signal = controller.signal;

  const startedAt = Date.now();
  let statusCode = 0;
  let responseBody: unknown = null;
  const responseHeaders: Record<string, string> = {};

  try {
    const response = await fetch(finalUrl, requestInit);
    statusCode = response.status;

    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    try {
      responseBody = await response.json();
    } catch {
      responseBody = await response.text();
    }
  } catch (error) {
    responseBody =
      error instanceof Error ? { error: error.message } : { error: "Unknown error" };
  } finally {
    clearTimeout(timeout);
  }

  return {
    endpoint,
    mutation,
    request: {
      url: finalUrl,
      method: endpoint.method,
      body,
      headers,
    },
    response: {
      statusCode,
      body: responseBody,
      responseTimeMs: Date.now() - startedAt,
      headers: responseHeaders,
    },
    curlCommand: buildCurlCommand(
      finalUrl,
      endpoint.method,
      endpoint.method === "GET" ? undefined : body,
      headers
    ),
  };
}

function classifyResult(result: TestResult): Finding | null {
  const { mutation, response } = result;
  const body = JSON.stringify(response.body || "");

  if (body.includes("Error:") || body.includes("stack")) {
    return buildFinding("critical", "Stack trace exposed", result);
  }

  if (body.includes("SELECT") || body.includes("FROM")) {
    return buildFinding("critical", "SQL leak", result);
  }

  if (mutation.attackCategory === "wrong_type" && response.statusCode === 200) {
    return buildFinding("critical", "Wrong type accepted", result);
  }

  if (mutation.attackCategory === "missing" && response.statusCode === 200) {
    return buildFinding("critical", "Missing field accepted", result);
  }

  if (response.statusCode >= 500) {
    return buildFinding("high", "Server error", result);
  }

  if (response.responseTimeMs > 8000) {
    return buildFinding("high", "Slow response", result);
  }

  if (mutation.attackCategory === "injection" && response.statusCode === 200) {
    return buildFinding("medium", "Injection accepted", result);
  }

  if (response.statusCode >= 400 && response.statusCode < 500) {
    return buildFinding(
      "info",
      "Client error response (possible validation)",
      result
    );
  }

  return null;
}

function buildFinding(
  severity: Finding["severity"],
  title: string,
  result: TestResult
): Finding {
  return {
    severity,
    title,
    description: title,
    endpoint: `${result.endpoint.method} ${result.endpoint.path}`,
    mutation: result.mutation,
    request: result.request,
    response: result.response,
    curlCommand: result.curlCommand,
  };
}

function getDefaultValue(field: Field): unknown {
  switch (field.type) {
    case "string":
      if (field.format === "email") {
        return "test@example.com";
      }
      if (field.format === "uuid") {
        return "123e4567-e89b-12d3-a456-426614174000";
      }
      return "test";
    case "integer":
    case "number":
      return 1;
    case "boolean":
      return true;
    case "array":
      return [];
    case "object":
      return {};
    default:
      return null;
  }
}

function buildUrl(baseUrl: string, routePath: string) {
  return `${baseUrl}${routePath.replace(/{[^}]+}/g, "1")}`;
}

function buildCurlCommand(
  url: string,
  method: Endpoint["method"],
  body: Record<string, unknown> | undefined,
  headers: Record<string, string>
) {
  const headerFlags = Object.entries(headers)
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(" ");
  const bodyFlag = body ? ` -d "${JSON.stringify(body).replace(/"/g, '\\"')}"` : "";

  return `curl -X ${method} "${url}" ${headerFlags}${bodyFlag}`.trim();
}
