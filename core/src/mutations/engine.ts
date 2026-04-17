import type { Mutation, Field , EndpointField } from "../mutations/mutation.types.js";
import { generateStringMutations } from "./strategies/string.mutations.js";
import { generateNumberMutations } from "./strategies/number.mutations.js";
import { generateBooleanMutations } from "./strategies/boolean.mutations.js";
import { generateArrayMutations } from "./strategies/array.mutations.js";



export interface Endpoint {
   path: string;
  method: string;
 fields: EndpointField[];
}

export function generateMutations(endpoint: Endpoint): Mutation[] {
  const allMutations: Mutation[] = [];

  for (const field of endpoint.fields) {
    
    let fieldMutations: Mutation[] = [];

    switch (field.type) {
      case "string":
        fieldMutations = generateStringMutations(field);
        break;

      case "number":
        fieldMutations = generateNumberMutations(field);
        break;

      case "boolean":
        fieldMutations = generateBooleanMutations(field);
        break;

      case "array":
        fieldMutations = generateArrayMutations(field);
        break;

      default:
      
        fieldMutations = [
          {
            fieldName: field.name,
            originalType: field.type,
            attackValue: null,
            attackCategory: "wrong_type",
            description: "Unsupported field type mutation",
          },
        ];
    }

    allMutations.push(...fieldMutations);

 
    if (field.required === true) {
      allMutations.push({
        fieldName: field.name,
        originalType: field.type,
        attackValue: undefined,
        attackCategory: "missing",
        description: `Missing required field '${field.name}'`,
      });
    }
  }

  return allMutations;
}