import { parseOpenAPI } from "./ingestion/parser.js";
import { generateMutations } from "./mutations/engine.js";
import type { Mutation } from "./mutations/mutation.types.js";

const specPath = process.argv[3];

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
  }
}

main();