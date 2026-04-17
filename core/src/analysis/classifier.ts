import type { TestResult } from "../runner/result.types.js";
import type { Mutation } from "../mutations/mutation.types.js";

export type Finding = {
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  description: string;
  endpoint: string;
  mutation: Mutation;
  request: TestResult["request"];
  response: TestResult["response"];
  curlCommand: string;
};


export function classifyResult(result: TestResult): Finding | null {
  const { response, mutation } = result;
  const bodyStr = JSON.stringify(response.body || "");

  
  if (
    bodyStr.includes("Error:") ||
    bodyStr.includes("stack")
  ) return build("critical", "Stack trace exposed", result);

  if (
    bodyStr.includes("SELECT") ||
    bodyStr.includes("FROM")
  ) return build("critical", "SQL leak", result);

  if (
    mutation.attackCategory === "wrong_type" &&
    response.statusCode === 200
  ) return build("critical", "Wrong type accepted", result);

  if (
    mutation.attackCategory === "missing" &&
    response.statusCode === 200
  ) return build("critical", "Missing field accepted", result);

  if (response.statusCode >= 500)
    return build("high", "Server error", result);

  if (response.responseTimeMs > 8000)
    return build("high", "Slow response", result);

  if (
    mutation.attackCategory === "injection" &&
    response.statusCode === 200
  ) return build("medium", "Injection accepted", result);



  if (response.statusCode >= 400 && response.statusCode < 500) {
    return build(
      "info",
      "Client error response (possible validation)",
      result
    );
  }

  if (response.statusCode === 422)
    return build("info", "Validation handled (422)", result);

  return null;
}



function build(
  severity: Finding["severity"],
  title: string,
  result: TestResult
): Finding {
  return {
    severity,
    title,
    description: title,
    endpoint: result.endpoint.path,
    mutation: result.mutation,
    request: result.request,
    response: result.response,
    curlCommand: result.curlCommand,
  };
}