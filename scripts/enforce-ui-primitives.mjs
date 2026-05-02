import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, "../src");

// Folders to completely ignore from this check
const IGNORE_DIRS = ["components/primitives", "components/ui"];

// Native elements to forbid
const FORBIDDEN_ELEMENTS = [
	"button",
	"input",
	"select",
	"textarea",
	"img",
	"label",
	"table",
	"hr",
	"a",
];

const regexes = FORBIDDEN_ELEMENTS.map((el) => {
	// Matches <element , <element>, but not </element> since that implies the open tag was caught
	return {
		element: el,
		regex: new RegExp(`<${el}[\\s>]`, "g"),
	};
});

let hasErrors = false;

function walkDir(dir) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			// Skip ignored directories
			if (
				IGNORE_DIRS.some((ignored) =>
					fullPath.includes(path.normalize(ignored)),
				)
			) {
				continue;
			}
			walkDir(fullPath);
		} else if (
			stat.isFile() &&
			(fullPath.endsWith(".tsx") || fullPath.endsWith(".jsx"))
		) {
			checkFile(fullPath);
		}
	}
}

function checkFile(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	// A naive removal of multi-line comments and single-line comments to avoid false positives
	const codeWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");

	for (const { element, regex } of regexes) {
		const matches = [...codeWithoutComments.matchAll(regex)];
		for (const match of matches) {
			hasErrors = true;
			// Calculate line number by counting newlines up to the match index
			const lineNumber = content.substring(0, match.index).split("\n").length;
			console.error(`\n❌ Forbidden native element <${element}> found!`);
			console.error(`   File: ${filePath}:${lineNumber}`);
			console.error(
				`   Fix : Use custom primitives instead (e.g., <Button>, <Input>, etc.)\n`,
			);
		}
	}
}

console.log("Checking for forbidden native elements...");
walkDir(srcDir);

if (hasErrors) {
	console.error(
		"❌ Enforcement failed. Native elements must not be used outside of primitive components.",
	);
	process.exit(1);
} else {
	console.log("✅ All UI primitive usage is strictly enforced.\n");
}
