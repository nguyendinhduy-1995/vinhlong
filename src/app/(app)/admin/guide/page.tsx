import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UnifiedGuideClient } from "@/components/admin/UnifiedGuideClient";

export const dynamic = "force-dynamic";

export default function AdminGuidePage() {
  const filePath = join(process.cwd(), "FEATURE_MAP_AND_RUNBOOK.md");
  let runbookMarkdown = "";
  try {
    runbookMarkdown = readFileSync(filePath, "utf8");
  } catch {
    // fallback — file doesn't exist yet
  }

  return <UnifiedGuideClient runbookMarkdown={runbookMarkdown} />;
}
