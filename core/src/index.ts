import { parseOpenAPI } from "./ingestion/parser.js";
import { generateMutations } from "./mutations/engine.js";
import type { Mutation } from "./mutations/mutation.types.js";
import { runMutation } from "./runner/http.runner.js";
import { classifyResult } from "./analysis/classifier.js";
import type { Finding } from "./analysis/classifier.js";
import { writeFileSync } from "fs";

const specIndex = process.argv.indexOf("--spec");
const specPath = specIndex !== -1 ? process.argv[specIndex + 1] : null;

function summarizeMutations(mutations: Mutation[]) {
  const summary = {
    wrong_type: 0,
    boundary: 0,
    injection: 0,
    missing: 0,
  };

  for (const m of mutations) {
    summary[m.attackCategory]++;
  }

  return summary;
}

async function main() {
  const findings: Finding[] = [];

  if (!specPath) {
    console.error("Please provide --spec <file>");
    process.exit(1);
  }

  const api = await parseOpenAPI(specPath);

  console.log(`Found ${api.endpoints.length} endpoints:\n`);

  for (const ep of api.endpoints) {
    const mutations = generateMutations(ep);
    const summary = summarizeMutations(mutations);

    console.log(
      `${ep.method} ${ep.path} — ${mutations.length} mutations generated`
    );

    console.log(`  - ${summary.wrong_type} wrong_type`);
    console.log(`  - ${summary.boundary} boundary`);
    console.log(`  - ${summary.injection} injection`);
    console.log(`  - ${summary.missing} missing\n`);

    for (const m of mutations.slice(0, 2)) {
      const result = await runMutation(api.baseUrl, ep, m);

      const finding = classifyResult(result);

      if (finding) {
        findings.push(finding);
      }

      console.log(`→ ${m.description}`);
      console.log(`Status: ${result.response.statusCode}`);
      console.log(`Time: ${result.response.responseTimeMs}ms`);
      console.log(result.curlCommand);
      console.log("\n");
    }
  }

  console.log(`Total findings: ${findings.length}`);

  
  return findings;
  
}

main();