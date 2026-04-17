
import type { Mutation } from "../mutation.types.js"

type Field = {
    name: string;
    type: string;
    format?: string;
};

export function generateStringMutations(field: Field & { required?: boolean }): Mutation[] {
    const mutations: Mutation[] = [
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "",
            attackCategory: "boundary",
            description: `Sending empty string for ${field.name}`,
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: " ",
            attackCategory: "boundary",
            description: `Sending only spaces for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "a".repeat(1000),
            attackCategory: "boundary",
            description: `Sending extremely large string for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: 123,
            attackCategory: "wrong_type",
            description: `Sending number instead of string for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: true,
            attackCategory: "wrong_type",
            description: `Sending boolean instead of string for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: null,
            attackCategory: "wrong_type",
            description: `Sending null instead of string for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: [],
            attackCategory: "wrong_type",
            description: `Sending array instead of string for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "<script>alert(1)</script>",
            attackCategory: "injection",
            description: `Sending XSS payload for ${field.name}`,
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "' OR 1=1 --",
            attackCategory: "injection",
            description: `Sending sql injection for ${field.name}`
        },
        {
            fieldName: field.name,
            originalType: field.type,
            attackValue: "../../../etc/passwd",
            attackCategory: "injection",
            description: `Sending path traversal for ${field.name}`
        }


    ]

    // email 
    if (field.format === "email") {
        mutations.push(
            {
                fieldName: field.name,
                originalType: field.type,
                attackValue: "notanemail",
                attackCategory: "boundary",
                description: `Invalid email format for ${field.name}`
            },
            {
                fieldName: field.name,
                originalType: field.type,
                attackValue: "@nodomain.com",
                attackCategory: "boundary",
                description: `Missing local part in email for ${field.name}`,
            },
            {
                fieldName: field.name,
                originalType: field.type,
                attackValue: "spaces in@email.com",
                attackCategory: "boundary",
                description: `Invalid characters in email for ${field.name}`,
            }
        );
    }
    return mutations;
}
