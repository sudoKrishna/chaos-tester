import type { Mutation } from "../mutation.types.js"

type Field = {
    name: string;
    type: string;
    format?: string;
};
8
export function generateBooleanMutations(field: Field): Mutation[] {
    const mutations : Mutation[] = [
    {
      fieldName: field.name,
      originalType: field.type,
      attackValue: "true",
      attackCategory: "wrong_type",
      description: "String instead of boolean",
    },
    {
      fieldName: field.name,
      originalType: field.type,
      attackValue: 1,
      attackCategory: "wrong_type",
      description: "Number instead of boolean",
    },
    {
      fieldName: field.name,
      originalType: field.type,
      attackValue: null,
      attackCategory: "wrong_type",
      description: "Null instead of boolean",
    },
    {
      fieldName: field.name,
      originalType: field.type,
      attackValue: [],
      attackCategory: "wrong_type",
      description: "Array instead of boolean",
    },
    {
      fieldName: field.name,
      originalType: field.type,
      attackValue: undefined,
      attackCategory: "missing",
      description: "Missing boolean field",
    },
  ];
  return mutations
}