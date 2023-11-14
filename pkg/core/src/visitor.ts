import { Parser, type StatementCst } from '@slangroom/core';

export type Statement = {
	openconnect?: string;
	bindings: Map<string, string>;
	phrase: string;
	into?: string;
};

export class ErrorKeyExists extends Error {
	constructor(key: string) {
		super(`key already exists: ${key}`);
		this.name = 'ErrorKeyExists';
	}
}

export const visit = (parser: Parser, cst: StatementCst): Statement => {
	const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Visitor {
		visit(cst: StatementCst): ReturnType<this['statement']>;
		// visit(cst: PhraseCst): ReturnType<this['phrase']>;
	}

	class Visitor extends BaseCstVisitor {
		constructor() {
			super();
			// we don't want validation since we can't provide one for phrases
			// this.validateVisitor();
		}

		statement(ctx: StatementCst['children']): Statement {
			const phrase = Object.entries(ctx).find(([k]) => k.endsWith('Phrase'))?.[1][0].children;
			if (!phrase) throw 'no way';

			delete phrase['And'];

			const openconnect =
				phrase['open']?.[0].image.slice(1, -1) ?? phrase['connect']?.[0].image.slice(1, -1);
			delete phrase['Open'];
			delete phrase['open'];
			delete phrase['Connect'];
			delete phrase['To'];
			delete phrase['connect'];

			const into = phrase['into']?.[0].image.slice(1, -1);
			delete phrase['Output'];
			delete phrase['Into'];
			delete phrase['into'];

			const bindings = new Map<string, string>();
			const phraseAcc: string[] = [];
			Object.entries(phrase).forEach((x) =>
				(function recurse(root, [k, [v]]) {
					if ('children' in v) {
						Object.entries(v.children).forEach((x) => recurse(v.children, x));
					} else if (/sendpass\d+/.test(k)) {
						if (!/sendpass\d+$/.test(k)) return;
						const param = root[`${k}.parameter`];
						const ident = root[`${k}.identifier`];
						if (param && 'image' in param[0] && ident && 'image' in ident[0]) {
							const key = param[0].image;
							const value = ident[0].image.slice(1, -1);
							// would not happen normally
							if (bindings.has(key)) throw new ErrorKeyExists(key);
							bindings.set(key, value);
						}
						delete root[k];
						delete root[`${k}.parameter`];
						delete root[`${k}.identifier`];
						delete root[`${k}.and`];
					} else {
						phraseAcc.push(v.image.toLowerCase());
					}
				})(phrase, x),
			);

			const stmt: Statement = {
				phrase: phraseAcc.join(' '),
				bindings: bindings,
			};

			if (openconnect) stmt.openconnect = openconnect;
			if (into) stmt.into = into;
			return stmt;
		}
	}

	const visitor = new Visitor();
	return visitor.visit(cst);
};
