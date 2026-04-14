import { parseOpenAPI } from "./ingestion/parser.js";

const specPath = process.argv[3];

async function main() {
    if (!specPath) {
  console.error("Please provide --spec <file>");
  process.exit(1);
}
  const api = await parseOpenAPI(specPath);

  console.log(`Found ${api.endpoints.length} endpoints:`);

  for (const ep of api.endpoints) {
    console.log(
      `  ${ep.method} ${ep.path} — ${ep.fields.length} fields`
    );
  }
}

main();