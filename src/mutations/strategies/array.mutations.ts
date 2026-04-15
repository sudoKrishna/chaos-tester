import type { Mutation } from "../mutation.types.js"

type Field = {
    name: string;
    type: string;
    format?: string ;
};

export function generateArrayMutations(field: Field): Mutation[] {
    const mutations : Mutation[] = [
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: [],
            attackCategory: "boundary",
            description: "Empty array",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: new Array(100000).fill("a"),
            attackCategory: "boundary",
            description: "Very large array",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: {},
            attackCategory: "wrong_type",
            description: "Object instead of array",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "not-an-array",
            attackCategory: "wrong_type",
            description: "String instead of array",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: null,
            attackCategory: "wrong_type",
            description: "Null instead of array",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: [1, "two", true],
            attackCategory: "boundary",
            description: "Mixed-type array",
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: ["<script>alert(1)</script>"],
            attackCategory: "injection",
            description: "XSS inside array",
        },
    ]
    return mutations;
}