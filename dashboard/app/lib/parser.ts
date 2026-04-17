import SwaggerParser from "@apidevtools/swagger-parser";
import type { Endpoint, Field, ParsedAPI } from "@/types";
import yaml from "js-yaml";

type OpenAPIParameter = {
  name: string;
  required?: boolean;
  schema?: {
    type?: string;
    format?: string;
  };
};

type OpenAPIRequestSchema = {
  required?: string[];
  properties?: Record<
    string,
    {
      type?: string;
      format?: string;
    }
  >;
};

type OpenAPIOperation = {
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content?: Record<
      string,
      {
        schema?: OpenAPIRequestSchema;
      }
    >;
  };
  security?: unknown;
};

type OpenAPIDocument = {
  servers?: Array<{ url?: string }>;
  host?: string;
  paths?: Record<string, Record<string, OpenAPIOperation>>;
};

export async function parseOpenAPI(specSource: string, overrideUrl?: string) {
  const doc = typeof specSource === "string"
    ? yaml.load(specSource)
    : specSource;

  const api = (await SwaggerParser.dereference(doc as any)) as OpenAPIDocument;

  const baseUrl =
    overrideUrl ||
    api.servers?.[0]?.url ||
    api.host ||
    "http://localhost";

  const endpoints: Endpoint[] = [];
  const paths = api.paths || {};

  for (const routePath of Object.keys(paths)) {
    const pathItem = paths[routePath];

    for (const method of Object.keys(pathItem)) {
      const op = pathItem[method];

      if (!isHttpMethod(method)) {
        continue;
      }

      const fields: Field[] = [];

      // Parameters
      if (Array.isArray(op.parameters)) {
        for (const param of op.parameters) {
          fields.push({
            name: param.name,
            type: mapType(param.schema?.type),
            required: param.required ?? false,
            format: param.schema?.format,
          });
        }
      }

      // Request Body
      if (op.requestBody?.content) {
        const content =
          op.requestBody.content["application/json"] ||
          Object.values(op.requestBody.content)[0];

        const schema = content?.schema;

        if (schema?.properties) {
          for (const key of Object.keys(schema.properties)) {
            const prop = schema.properties[key];

            fields.push({
              name: key,
              type: mapType(prop?.type),
              required: schema.required?.includes(key) ?? false,
              format: prop?.format,
            });
          }
        }
      }

      endpoints.push({
        path: routePath,
        method: method.toUpperCase() as Endpoint["method"],
        fields,
        hasAuth: Boolean(op.security),
      });
    }
  }

  return {
    baseUrl,
    endpoints,
  };
}

export const parseAPI = parseOpenAPI;

function isHttpMethod(method: string) {
  return ["get", "post", "put", "delete", "patch"].includes(method);
}

function mapType(type: string | undefined): Field["type"] {
  switch (type) {
    case "string":
    case "integer":
    case "number":
    case "boolean":
    case "array":
    case "object":
      return type;
    default:
      return "string";
  }
}