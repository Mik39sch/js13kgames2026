const fs = require("node:fs");
const path = require("node:path");

const SIZE_LIMIT = 13 * 1024;
const projectDirectory = path.resolve(__dirname, "..");
const sourceDirectory = path.join(projectDirectory, "dist");
const outputPath = path.join(projectDirectory, "submission.zip");

/** distの中身をルート直下に格納した提出用ZIPを生成する。 */
async function createSubmissionZip() {
  const { ZipArchive } = await import("archiver");

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDirectory, false);
    archive.finalize();
  });
}

/** ZIPサイズを13KB制限と比較して結果を表示する。 */
async function buildAndCheckZip() {
  if (!fs.existsSync(sourceDirectory)) {
    throw new Error("dist folder not found. Run npm run build first.");
  }

  await createSubmissionZip();

  const zipBytes = fs.statSync(outputPath).size;
  const remainingBytes = SIZE_LIMIT - zipBytes;
  const status = zipBytes <= SIZE_LIMIT ? "PASS" : "OVER LIMIT";

  console.log(`\nZIP size: ${zipBytes} bytes / ${SIZE_LIMIT} bytes`);
  console.log(`Remaining: ${remainingBytes} bytes`);
  console.log(`Result: ${status}`);
  console.log(`Output: ${outputPath}`);

  if (zipBytes > SIZE_LIMIT) process.exitCode = 1;
}

buildAndCheckZip().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
