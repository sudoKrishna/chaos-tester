import type { Endpoint } from "../types/index.js";
import type { Mutation } from "../mutations/mutation.types.js";


export interface TestResult {
    endpoint : Endpoint;
    mutation : Mutation;
    request : {
        url : string;
        method : string;
        body :  unknown;
        headers : Record<string, string>
    };

    response :  {
        statusCode : number;
        body : unknown;
        responseTimeMs : number;
        headers : Record<string , string>
    }
    curlCommand : string
}