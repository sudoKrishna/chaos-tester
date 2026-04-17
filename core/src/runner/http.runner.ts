import { fetch } from "undici";
import type { RequestInit } from "undici";
import type { Endpoint, Field } from "../types/index.js";
import type { Mutation } from "../mutations/mutation.types.js";
import type { TestResult } from "./result.types.js";
import { buildCurlCommand } from "./curl.js";

export async function runMutation(
  baseUrl: string,
  endpoint: Endpoint,
  mutation: Mutation
): Promise<TestResult> {
  const url = buildUrl(baseUrl, endpoint.path);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // ✅ 1. Build base valid body
  let body: Record<string, any> = {};

  for (const field of endpoint.fields) {
    body[field.name] = getDefaultValue(field);
  }

  
  if (mutation.attackCategory !== "missing") {
    body[mutation.fieldName] = mutation.attackValue;
  } else {
    delete body[mutation.fieldName];
  }



  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const start = Date.now();

  let statusCode = 0;
  let responseData: any = null;
  let responseHeaders: Record<string, string> = {};

  let finalUrl = url;
  try {
 const requestOptions: RequestInit = {
  method: endpoint.method,
  headers,
  signal: controller.signal,
};



if (endpoint.method === "GET") {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue ;
    
    if (typeof value === "object") {
      const json = JSON.stringify(value);

      if (json.length > 1000) continue;

      query.append(key, json); 
    } else {
      query.append(key, String(value));
    }
  }

  const qs = query.toString();
  if (qs.length > 0) {
    finalUrl = `${url}${url.includes("?") ? "&" : "?"}${qs}`;
  }
} else {
  requestOptions.body = JSON.stringify(body);
}


const res = await fetch(finalUrl, requestOptions);

    statusCode = res.status;

    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    try {
      responseData = await res.json();
    } catch {
      responseData = await res.text();
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      responseData = { error: "Request timeout (10s)" };
    } else {
      responseData = { error: err.message };
    }
  } finally {
    clearTimeout(timeout);
  }

  const end = Date.now();

  const curlCommand = buildCurlCommand(
  finalUrl, 
  endpoint.method,
  endpoint.method === "GET" ? undefined : body,
  headers
);

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
      body: responseData,
      responseTimeMs: end - start,
      headers: responseHeaders,
    },
    curlCommand,
  };
}

function getDefaultValue(field: Field): any {
  switch (field.type) {
    case "string":
      if (field.format === "email") return "test@example.com";
      if (field.format === "uuid")
        return "123e4567-e89b-12d3-a456-426614174000";
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

function buildUrl(baseUrl: string, path: string): string {
  return baseUrl + path.replace(/{[^}]+}/g, "1");
}