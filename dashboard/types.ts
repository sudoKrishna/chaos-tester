export type Severity = "critical" | "high" | "medium" | "info";

export type FieldType =
  | "string"
  | "integer"
  | "number"
  | "boolean"
  | "array"
  | "object";

export type Field = {
  name: string;
  type: FieldType;
  required: boolean;
  format?: string;
};

export type Endpoint = {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  fields: Field[];
  hasAuth: boolean;
};

export type ParsedAPI = {
  baseUrl: string;
  endpoints: Endpoint[];
};

export type MutationCategory =
  | "wrong_type"
  | "boundary"
  | "injection"
  | "missing";

export type Mutation = {
  fieldName: string;
  originalType: string;
  attackValue: unknown;
  attackCategory: MutationCategory;
  description: string;
};

export type Finding = {
  severity: Severity;
  title: string;
  description: string;
  endpoint: string;
  mutation: Mutation;
  request: {
    url: string;
    method: Endpoint["method"];
    body: Record<string, unknown>;
    headers: Record<string, string>;
  };
  response: {
    statusCode: number;
    body: unknown;
    responseTimeMs: number;
    headers: Record<string, string>;
  };
  curlCommand: string;
};

export type ScanReport = {
  baseUrl: string;
  totalEndpoints: number;
  totalFindings: number;
  findings: Finding[];
};
