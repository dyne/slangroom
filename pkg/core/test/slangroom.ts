import test from 'ava';
import { BeforePlugin, AfterPlugin, Slangroom } from '@slangroom/core';

test('adding a plugin correctly falls into either before or after', (t) => {
	const before = new BeforePlugin(() => {
		return;
	});
	const after = new AfterPlugin(() => {
		return;
	});
	const slang = new Slangroom(before, after);

	t.is(slang.beforeExecution.size, 1);
	t.true(slang.beforeExecution.has(before));

	t.is(slang.afterExecution.size, 1);
	t.true(slang.afterExecution.has(after));
});

test('no plugins are executed if no ignored statemnets are found', async (t) => {
	let hasBeforeRan = false;
	let hasAfterRan = false;
	const before = new BeforePlugin(() => {
		hasBeforeRan = true;
		return;
	});
	const after = new BeforePlugin(() => {
		hasAfterRan = true;
		return;
	});
	const slang = new Slangroom([before, after]);
	const contract = `Given I have nothing
Then I print the string 'I love you'
`;
	await slang.execute(contract);
	t.false(hasBeforeRan);
	t.false(hasAfterRan);
});

test('before-plugins runs before the actual execution and after-plugins runs after', async (t) => {
	let hasBeforeRan = false;
	let hasAfterRan = false;
	const before = new BeforePlugin(() => {
		t.false(hasBeforeRan);
		t.false(hasAfterRan);
		hasBeforeRan = true;
		return;
	});
	const after = new AfterPlugin(() => {
		t.true(hasBeforeRan);
		t.false(hasAfterRan);
		hasAfterRan = true;
		return;
	});
	const slang = new Slangroom(new Set([before, after]));
	const contract = `Rule unknown ignore

Given I have nothing
Then I print the string 'I love you'
Then this statement does not exist
`;
	await slang.execute(contract);
	t.true(hasBeforeRan);
	t.true(hasAfterRan);
});
