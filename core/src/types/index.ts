import { z } from "zod";


const FieldTypeEnum = z.enum([
"string" ,
"integer",
"number",
"boolean",
"array",
"object",
])

const HttpMethodEnum = z.enum([
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH"
])

export const FieldSchema = z.object ({
  name : z.string(),
  type : FieldTypeEnum,
  required : z.boolean(),
  format : z.string().optional(),
});


export const EndpointSchema = z.object ({
    path : z.string(),
    method : HttpMethodEnum,
    fields:  z.array(FieldSchema),
    hasAuth: z.boolean(),

})

export const ParsedAPISchema = z.object ({
  baseUrl: z.string(),
  endpoints: z.array(EndpointSchema)
})

export type Field = z.infer<typeof FieldSchema>;
export type Endpoint = z.infer<typeof EndpointSchema>;
export type ParsedAPI = z.infer<typeof ParsedAPISchema>;