// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ExternalTokenizer } from '@lezer/lr';
import {
	eof,
	version,
	unknown,
	ignore,
	have,
	a,
	my,
	that,
	valid,
	inside,
	named,
	am,
	known,
	as,
	connect,
	open,
	to,
	and,
	send,
	statement,
	parameters,
	record,
	table,
	variable,
	name,
	address,
	transaction_id,
	addresses,
	transaction,
	sc,
	path,
	content,
	commit,
	paths,
	array,
	values,
	value,
	sources,
	properties,
	headers,
	object,
	json_data,
	json_schema,
	request,
	uri,
	server_data,
	client,
	expires_in,
	token,
	request_uri,
	data,
	my_credentials,
	email,
	list_parameters,
	show_parameters,
	create_parameters,
	record_parameters,
	update_parameters,
	delete_parameters,
	send_parameters,
	url,
	text,
	command,
	jwk,
	holder,
	fields,
	verifier_url,
	issued_vc,
	disclosed,
	nonce,
	sk,
	script,
	key,
	keys,
	extra,
	conf,
	execute,
	sql,
	_with,
	read,
	file,
	the,
	of,
	database,
	save,
	ethereum,
	bytes,
	balance,
	suggested,
	gas,
	price,
	id,
	after,
	broadcast,
	erc20,
	decimals,
	symbol,
	total,
	supply,
	erc721,
	_in,
	owner,
	asset,
	download,
	extract,
	verbatim,
	store,
	list,
	directory,
	exists,
	does,
	not,
	exist,
	verify,
	git,
	repository,
	clone,
	create,
	_new,
	manipulate,
	get,
	set,
	merge,
	omit,
	concat,
	compact,
	pick,
	_do,
	sequential,
	parallel,
	same,
	post,
	put,
	patch,
	validate,
	json,
	generate,
	access,
	authorization,
	code,
	details,
	from,
	add,
	start,
	pb,
	capacitor,
	login,
	ask,
	password,
	reset,
	some,
	records,
	one,
	update,
	qr,
	write,
	into,
	redis,
	_delete,
	shell,
	fetch,
	local,
	timestamp,
	milliseconds,
	seconds,
	present,
	vc,
	sd,
	jwt,
	p256,
	_public,
	pretty,
	print,
	zencode,
	output,
	is,
	given,
	then,
	when,
	rule,
	scenario,
	_if,
	endif,
	foreach,
	endforeach,
	I,
} from './syntax.grammar.terms';

export const Eoftoken = new ExternalTokenizer(
	(input) => {
		if (input.next < 0) {
			input.acceptToken(eof);
		}
	},
	{ contextual: true, fallback: true },
);
const keywordMap = {
	version,
	unknown,
	ignore,
	have,
	a,
	my,
	that,
	valid,
	inside,
	named,
	am,
	known,
	as,
	connect,
	to,
	open,
	and,
	send,
	statement,
	parameters,
	record,
	table,
	variable,
	name,
	address,
	transaction_id,
	addresses,
	transaction,
	sc,
	path,
	content,
	commit,
	paths,
	array,
	values,
	value,
	sources,
	properties,
	headers,
	object,
	json_data,
	json_schema,
	request,
	uri,
	server_data,
	client,
	expires_in,
	token,
	request_uri,
	data,
	my_credentials,
	email,
	list_parameters,
	show_parameters,
	create_parameters,
	record_parameters,
	update_parameters,
	delete_parameters,
	send_parameters,
	url,
	text,
	command,
	jwk,
	holder,
	fields,
	verifier_url,
	issued_vc,
	disclosed,
	nonce,
	sk,
	script,
	key,
	keys,
	extra,
	conf,
	execute,
	sql,
	with: _with,
	read,
	file,
	the,
	of,
	database,
	save,
	ethereum,
	bytes,
	balance,
	suggested,
	gas,
	price,
	id,
	after,
	broadcast,
	erc20,
	decimals,
	symbol,
	total,
	supply,
	erc721,
	in: _in,
	owner,
	asset,
	download,
	extract,
	verbatim,
	store,
	list,
	directory,
	exists,
	does,
	not,
	exist,
	verify,
	git,
	repository,
	clone,
	create,
	new: _new,
	manipulate,
	get,
	set,
	merge,
	omit,
	concat,
	compact,
	pick,
	do: _do,
	sequential,
	parallel,
	same,
	post,
	put,
	patch,
	validate,
	json,
	generate,
	access,
	authorization,
	code,
	details,
	from,
	add,
	start,
	pb,
	capacitor,
	login,
	ask,
	password,
	reset,
	some,
	records,
	one,
	update,
	qr,
	write,
	into,
	redis,
	delete: _delete,
	shell,
	fetch,
	local,
	timestamp,
	milliseconds,
	seconds,
	present,
	vc,
	sd,
	jwt,
	public: _public,
	pretty,
	print,
	zencode,
	output,
	is,
	given,
	then,
	when,
	rule,
	scenario,
	if: _if,
	endif,
	foreach,
	endforeach,
	I,
	p256,
};

export function keywords(name) {
	if (name == 'I') {
		return keywordMap[name];
	}

	let found = keywordMap[name.toLowerCase()];
	return found == null ? -1 : found;
}
