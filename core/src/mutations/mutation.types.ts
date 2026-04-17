import { z } from "zod";


export type EndpointField = Field & {
  required: boolean;
};
export interface Field {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "integer" | "array";
  format?: string | any ; 
}

const MutationTypeEnum = z.enum([
  "wrong_type",
  "boundary",
  "injection",
  "missing",
]);

export const MutationSchema = z.object({
  fieldName: z.string(), 
  originalType: z.string(),
  attackValue: z.unknown(),
  attackCategory: MutationTypeEnum,
  description: z.string(),
});


export type Mutation = z.infer<typeof MutationSchema>;