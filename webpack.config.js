const fs = require("node:fs");
const path = require("node:path");

/** 静的ファイルをdistへコピーし、提出物の合計サイズを表示する。 */
class SubmissionFilesPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap("SubmissionFilesPlugin", () => {
      const outputDirectory = compiler.options.output.path;
      const staticFiles = ["index.html", "style.css"];

      for (const fileName of staticFiles) {
        fs.copyFileSync(
          path.resolve(__dirname, fileName),
          path.resolve(outputDirectory, fileName),
        );
      }

      const submissionFiles = fs.readdirSync(outputDirectory);
      const totalBytes = submissionFiles.reduce((total, fileName) => {
        const filePath = path.resolve(outputDirectory, fileName);
        return total + fs.statSync(filePath).size;
      }, 0);

      console.log(`\nSubmission size: ${totalBytes} bytes / 13312 bytes`);
    });
  }
}

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    clean: true,
  },
  optimization: {
    minimize: true,
  },
  plugins: [new SubmissionFilesPlugin()],
};
