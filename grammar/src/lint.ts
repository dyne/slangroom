// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { linter, Diagnostic } from "@codemirror/lint";
import { fullStatementTemplates } from "./complete_statement";
import { distance } from "fastest-levenshtein"

// Helper function to extract the content inside quotes
function extractContent(line: string): string[] {
	return [...line.matchAll(/'([^']*)'/g)].map(match => match[1]);
}

// Helper function to insert the content into the template
function insertContent(template: string, content: string[]): string {
	let contentIndex = 0;
	return template.replace(/''/g, () => `'${content[contentIndex++] || ""}'`);
}

// Normalize a line (case-insensitive, remove extra spaces)
function normalizeLine(line: string): string {

    const regex = /'[^']*'|[^'\s]+/g;

    return line.match(regex)?.map((word) => {
        if (word.startsWith("'") && word.endsWith("'")) {
            return word;
        }
        if (word === 'I' || word === 'i') {
            return word;
        }
        return word.toLowerCase();
    }).join(' ').trim() || '';
}

// Helper function to generate permutations of "send" phrases
function generateSendPermutations(statement: string): string[] {
	const sendParts = statement.match(/send [^']+ ''/g) || [];
	if (sendParts.length <= 1) return [statement];

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


function capitalize(statement: string): string {
	return statement.charAt(0).toUpperCase() + statement.slice(1);
}

// Helper function to find the most similar correct statements
function findMostSimilarStatements(wrongStatement: string, correctStatements: string[]): string[] {
	const scores = correctStatements.map(template => {
		const normalizedTemplate = normalizeLine(template);
		return {
			statement: template,
			distance: distance(normalizedTemplate, wrongStatement)
		};
	});

	// Sort by similarity (smallest Levenshtein distance)
	scores.sort((a, b) => a.distance - b.distance);

	// Return the top 3 most similar statements
	return scores.slice(0, 3).map(score => capitalize(score.statement));
}

const correctStatements = fullStatementTemplates.flatMap(template => {
	const normalizedTemplate = normalizeLine(template.displayLabel);
	return generateSendPermutations(normalizedTemplate);
});


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
		if (lineText === '' || lineText.startsWith('#')) {
			continue;
		}

		const content = extractContent(lineText);

		const normalizedLine = normalizeLine(lineText);
		const modifiedStatements = correctStatements.map(template => {
			const updatedTemplate = insertContent(template, content);
			return updatedTemplate;
		});

		const matchesStatement = modifiedStatements.includes(normalizedLine);

		if (!matchesStatement) {
			const mostSimilarStatements = findMostSimilarStatements(normalizedLine, modifiedStatements);

			diagnostics.push({
				from: line.from,
				to: line.to,
				severity: 'error',
				message: 'Invalid statement, do you mean:',
				actions: mostSimilarStatements.map((statement) => ({
					name: statement,
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

