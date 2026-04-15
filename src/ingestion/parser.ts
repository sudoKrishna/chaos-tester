import SwaggerParser from "@apidevtools/swagger-parser";
import type { ParsedAPI, Endpoint, Field } from "../types/index.js";

export async function parseOpenAPI(filePath: string): Promise<ParsedAPI> {
  const api: any = await SwaggerParser.dereference(filePath);

  const baseUrl =
    api.servers?.[0]?.url ||
    api.host ||
    "http://localhost";

  const endpoints: Endpoint[] = [];

  const paths = api.paths || {};

  for (const path in paths) {
    const pathItem = paths[path];

    for (const method of Object.keys(pathItem)) {
      const op = pathItem[method];

      const fields: Field[] = [];

      // Parameters (query, path, header)
      if (op.parameters) {
        for (const param of op.parameters) {
          fields.push({
            name: param.name,
            type: mapType(param.schema?.type),
            required: param.required ?? false,
            format: param.schema?.format,
          });
        }
      }

      // Request Body (OpenAPI 3)
      if (op.requestBody?.content) {
        const content = op.requestBody.content["application/json"];
        const schema = content?.schema;

        if (schema?.properties) {
          for (const key in schema.properties) {
            const prop = schema.properties[key];

            fields.push({
              name: key,
              type: mapType(prop.type),
              required: schema.required?.includes(key) ?? false,
              format: prop.format,
            });
          }
        }
      }

      endpoints.push({
        path,
        method: method.toUpperCase()  as Endpoint["method"],
        fields,
        hasAuth: !!op.security,
      });
    }
  }

  return {
    baseUrl,
    endpoints,
  };
}

// 🔧 helper
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