import { linter, Diagnostic } from "@codemirror/lint";
import { fullStatementTemplates } from "./complete_statement";

const defaultStatements = [
	"given I connect to '' and send statement '' and execute sql statement",
	"then I connect to '' and send variable '' and send name '' and send table '' and save the variable in the database table",
	'Error',
];

// Helper function to remove words inside quotes (but keep the quotes)
function removeWordsInsideQuotes(s: string) {
	return s.replace(/'[^']*'/g, "''");
}

// Normalize a line (case-insensitive, remove extra spaces)
function normalizeLine(line: string): string {
	return removeWordsInsideQuotes(line).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Helper function to generate permutations of "send" phrases
function generateSendPermutations(statement: string): string[] {
	const sendParts = statement.match(/send [^']+ ''/g) || [];
	if (sendParts.length <= 1) return [statement];

	// Generate permutations for multiple send statements
	const permute = (arr: string[], result: string[] = []) => {
		if (arr.length === 0) return [result.join(' and ')];
		let permutations: string[] = [];
		for (let i = 0; i < arr.length; i++) {
			const current = arr.slice();
			const next = current.splice(i, 1);
			permutations = permutations.concat(permute(current, result.concat(next)));
		}
		return permutations;
	};

	const permutedSendParts = permute(sendParts);
	return permutedSendParts.map((perm) =>
		statement.replace(/(send [^']+ '')( and send [^']+ '')*/g, perm),
	);
}

// The linter function
export const customLinter = linter((view) => {
	let diagnostics: Diagnostic[] = [];
	const doc = view.state.doc;
	const cursorLine = view.state.selection.main.head;
	const lineCount = doc.lines;

	for (let i = 1; i <= lineCount; i++) {
		const line = doc.line(i);

		// Ignore the line where the cursor is
		if (line.from <= cursorLine && cursorLine <= line.to) {
			continue;
		}

		const lineText = line.text.trim();

		// Ignore empty lines and comment lines
		if (lineText === '' || lineText.startsWith('//')) {
			continue;
		}

		const normalizedLine = normalizeLine(lineText);

		// Check if the normalized line matches any of the allowed statements or their permutations
		const matchesStatement = fullStatementTemplates.some((template) => {
			const normalizedTemplate = normalizeLine(template.label);
			const permutedTemplates = generateSendPermutations(normalizedTemplate);

			// Check against all possible permutations of the template
			return permutedTemplates.some((permTemplate) => normalizedLine === permTemplate);
		});

		// If no match, offer replacement suggestions
		if (!matchesStatement) {
			diagnostics.push({
				from: line.from,
				to: line.to,
				severity: 'error',
				message: 'Invalid statement, do you mean:',
				actions: defaultStatements.map((statement) => ({
					name: statement, // Each action is labeled with the default statement
					apply(view, from, to) {
						view.dispatch({
							changes: { from, to, insert: statement },
						});
					},
				})),
			});
		}
	}

	return diagnostics;
});
