// Default: offline validation and workflow compilation. --preflight only reads
// balance. --execute is the explicit paid operation, with a required estimate
// limit; it must only be used after the user authorizes this particular batch.
const fs = require("node:fs");
const path = require("node:path");
require("./register-typescript.cjs");
const { buildH3Workflow } = require("../lib/agents/h3-workflow.ts");
const { getH3Preflight, generateH3Batch } = require("../lib/agents/minimax-h3.ts");

async function main() {
  const args = process.argv.slice(2);
  const manifestArg = args.find((arg) => !arg.startsWith("--"));
  if (!manifestArg) throw new Error("Usage: node scripts/h3-batch.cjs <manifest.json> [--preflight | --execute --max-estimated-usd=VALUE]");
  for (const arg of args.filter((a) => a.startsWith("--"))) {
    if (!["--preflight", "--execute", "--dry-run"].includes(arg) && !arg.startsWith("--max-estimated-usd=")) throw new Error(`Unknown option: ${arg}`);
  }
  if (args.includes("--execute") && (args.includes("--preflight") || args.includes("--dry-run"))) throw new Error("Choose one operation: dry-run, preflight or execute.");
  const filename = path.resolve(manifestArg);
  const plan = JSON.parse(fs.readFileSync(filename, "utf8"));
  if (!Array.isArray(plan.shots) || !plan.shots.length || plan.shots.length > 100) throw new Error("Manifest must contain 1–100 shots.");
  const localReference = (ref) => {
    if (!ref) return undefined;
    if (typeof ref !== "string") throw new Error("Reference must be a filename.");
    // A review pack uses local approved images, never arbitrary remote requests.
    if (!/\.(png|jpe?g|webp)$/i.test(ref)) throw new Error("Reference must be a PNG, JPEG or WebP image.");
    const resolved = path.resolve(path.dirname(filename), ref);
    if (!fs.existsSync(resolved)) throw new Error(`Reference not found: ${ref}`);
    return resolved;
  };
  const shots = plan.shots.map((shot, index) => {
    if (typeof shot.prompt !== "string" || !shot.prompt.trim()) throw new Error(`Shot ${index + 1} needs a prompt.`);
    const continuityMode = shot.continuityMode ?? "cut";
    if (!["cut", "continue"].includes(continuityMode)) throw new Error(`Shot ${index + 1}: invalid continuity mode.`);
    const input = {
      ...plan.settings, ...shot.settings, prompt: shot.prompt, continuityMode,
      referenceImageUrl: localReference(shot.firstFrame),
      lastFrameImageUrl: localReference(shot.lastFrame)
    };
    if (index === 0 && continuityMode === "continue" && !input.referenceImageUrl) throw new Error("The first shot cannot continue from a nonexistent previous clip.");
    return input;
  });
  const compiled = shots.map((shot, index) => ({
    id: plan.shots[index].id ?? `shot-${index + 1}`,
    continuityMode: shot.continuityMode,
    ...buildH3Workflow({
      ...shot,
      firstFrameName: shot.referenceImageUrl ? `shot-${index + 1}-start.png` : shot.continuityMode === "continue" ? `previous-actual-last.png` : undefined,
      lastFrameName: shot.lastFrameImageUrl ? `shot-${index + 1}-end.png` : undefined
    })
  }));
  const compiledFile = filename.replace(/\.json$/i, "") + ".compiled.json";
  fs.writeFileSync(compiledFile, JSON.stringify({ note: "Offline graphs. Reference names must be replaced by ComfyUI upload responses; this is not a generation result.", shots: compiled }, null, 2));
  console.log(`Validated ${shots.length} shots. Compiled preview: ${compiledFile}`);
  console.log(`Requested output: ${compiled.reduce((sum, shot) => sum + shot.settings.frames, 0)} frames at 24fps.`);
  if (!args.includes("--execute") && !args.includes("--preflight")) {
    console.log("Offline only: no network, LLM call, GPU start or paid generation.");
    if (plan.readyForGeneration !== true) console.log(`Draft remains blocked: ${(plan.blockers || ["Confirm script/reference mapping"]).join("; ")}`);
    return;
  }
  if (args.includes("--preflight")) {
    console.log(JSON.stringify(await getH3Preflight(shots), null, 2));
    return;
  }
  if (plan.readyForGeneration !== true) throw new Error("This manifest is still a draft. Resolve its stated script/reference blockers before executing.");
  const limit = Number(args.find((arg) => arg.startsWith("--max-estimated-usd="))?.split("=")[1]);
  if (!Number.isFinite(limit) || limit <= 0) throw new Error("Paid execution requires --max-estimated-usd=VALUE. This is an estimate guard, not a provider-enforced cap.");
  const journal = filename.replace(/\.json$/i, "") + `.results-${Date.now()}.json`;
  const results = [];
  await generateH3Batch(shots, {
    maxEstimatedCostUsd: limit,
    onShot: (result, index) => {
      results.push({ id: compiled[index].id, ...result });
      fs.writeFileSync(journal, JSON.stringify({ completed: results, visualReviewRequired: true }, null, 2));
      console.log(`Completed shot ${index + 1}/${shots.length}: ${result.url}`);
    }
  });
  console.log(`Batch complete; pod stop confirmed. Watch every clip and inspect the joins before assembly. Results: ${journal}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
