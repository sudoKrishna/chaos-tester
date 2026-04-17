import type { Mutation } from "../mutation.types.js"

type Field = {
    name: string;
    type: string;
    format?: string;
};
8
export function generateNumberMutations(field: Field): Mutation[] {
    const mutations : Mutation[] = [
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: -1,
            attackCategory: "boundary",
            description: "Negative number",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: Number.MAX_SAFE_INTEGER,
            attackCategory: "boundary",
            description: "Very large number",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: 0,
            attackCategory: "boundary",
            description: "Zero value",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: 1.7976931348623157e+308,
            attackCategory: "boundary",
            description: "Extremely large float",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "123",
            attackCategory: "boundary",
            description: "String instead of number",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: true,
            attackCategory: "wrong_type",
            description: "Boolean instead of number",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: null,
            attackCategory: "wrong_type",
            description: "Null instead of number",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: [],
            attackCategory: "wrong_type",
            description: "Array instead of number",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "1; DROP TABLE users",
            attackCategory: "injection",
            description: "SQL injection via number field",
        },
    ];
    return mutations;
}


