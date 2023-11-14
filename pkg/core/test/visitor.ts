import test from 'ava';
import { Parser, Lexicon, parse, lex, visit } from '@slangroom/core';

const astify = (line: string, parser: (this: Parser) => void) => {
	const lxcon = new Lexicon();
	const p = new Parser(lxcon, [parser]);
	const lexed = lex(lxcon, line);
	if (lexed.errors.length) throw lexed.errors;
	const parsed = parse(p, lexed.tokens);
	if (parsed.errors.length) throw parsed.errors;
	return visit(p, parsed.cst as Parameters<typeof visit>[1]);
};

test('ast is okay: only phrase is given', (t) => {
	const ast = astify('read the    ethereum		 balance', function (this: Parser) {
		this.RULE('testPhrase', () => {
			this.token('read');
			this.token('the');
			this.token('ethereum');
			this.token('balance');
		});
	});
	t.deepEqual(ast, {
		phrase: 'read the ethereum balance',
		bindings: new Map<string, string>(),
	});
});

test('ast is okay: phrase and connect are given', (t) => {
	const ast = astify(
		"connect to 'foo' and read the    ethereum		 balance",
		function (this: Parser) {
			this.RULE('testPhrase', () => {
				this.connect();
				this.token('read');
				this.token('the');
				this.token('ethereum');
				this.token('balance');
			});
		},
	);
	t.deepEqual(ast, {
		openconnect: 'foo',
		phrase: 'read the ethereum balance',
		bindings: new Map<string, string>(),
	});
});

test('ast is okay: phrase and open are given', (t) => {
	const ast = astify("open 'foo' and read the    ethereum		 balance", function (this: Parser) {
		this.RULE('testPhrase', () => {
			this.open();
			this.token('read');
			this.token('the');
			this.token('ethereum');
			this.token('balance');
		});
	});
	t.deepEqual(ast, {
		openconnect: 'foo',
		phrase: 'read the ethereum balance',
		bindings: new Map<string, string>(),
	});
});

test('ast is okay: phrase and bindings are given', (t) => {
	const ast = astify(
		"send address 'addr'  and pass contract 'contract' and read the    ethereum		 balance",
		function (this: Parser) {
			this.RULE('testPhrase', () => {
				this.sendpass('address');
				this.sendpass1('contract');
				this.token('read');
				this.token('the');
				this.token('ethereum');
				this.token('balance');
			});
		},
	);
	t.deepEqual(ast, {
		phrase: 'read the ethereum balance',
		bindings: new Map<string, string>([
			['address', 'addr'],
			['contract', 'contract'],
		]),
	});
});

test('ast is okay: phrase and connect and bindings are all given', (t) => {
	const ast = astify(
		"connect to 'foo' and pass address 'addr'  and send contract 'contract' and read the    ethereum		 balance",
		function (this: Parser) {
			this.RULE('testPhrase', () => {
				this.connect();
				this.sendpass('address');
				this.sendpass1('contract');
				this.token('read');
				this.token('the');
				this.token('ethereum');
				this.token('balance');
			});
		},
	);
	t.deepEqual(ast, {
		openconnect: 'foo',
		phrase: 'read the ethereum balance',
		bindings: new Map<string, string>([
			['address', 'addr'],
			['contract', 'contract'],
		]),
	});
});

test('ast is okay: phrase and open and bindings are all given', (t) => {
	const ast = astify(
		"open 'foo' and pass address 'addr'  and send contract 'contract' and read the    ethereum		 balance",
		function (this: Parser) {
			this.RULE('testPhrase', () => {
				this.open();
				this.sendpass('address');
				this.sendpass1('contract');
				this.token('read');
				this.token('the');
				this.token('ethereum');
				this.token('balance');
			});
		},
	);
	t.deepEqual(ast, {
		openconnect: 'foo',
		phrase: 'read the ethereum balance',
		bindings: new Map<string, string>([
			['address', 'addr'],
			['contract', 'contract'],
		]),
	});
});
