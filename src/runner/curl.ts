export function buildCurlCommand(
  url: string,
  method: string,
  body: unknown,
  headers: Record<string, string>
): string {
  let cmd = `curl -X ${method.toUpperCase()} "${url}"`;

  for (const [key, value] of Object.entries(headers)) {
    cmd += ` \\\n  -H "${key}: ${value}"`;
  }

  if (body && method !== "GET") {
    const bodyString =
      typeof body === "string" ? body : JSON.stringify(body);

    const escapedBody = bodyString.replace(/"/g, '\\"');

    cmd += ` \\\n  -d "${escapedBody}"`;
  }

  return cmd;
}