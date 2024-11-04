#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2024 Dyne.org foundation
#
# SPDX-License-Identifier: AGPL-3.0-or-later

temp_dir="pkg/oauth/test/didroom_microservices"

setup() {
	if [ ! -d ${temp_dir} ]; then
		git clone https://github.com/ForkbombEu/DIDroom_microservices.git ${temp_dir} --quiet
		cd ${temp_dir} && git checkout fix/claims --quiet && cd -
	fi

	if [ ! -x ${temp_dir}/ncr ]; then
		wget -q --show-progress https://github.com/ForkbombEu/ncr/releases/download/v1.39.6/ncr -O ${temp_dir}/ncr
		chmod +x ${temp_dir}/ncr
	fi

	make -C ${temp_dir} test_custom_code --no-print-directory
	make -C ${temp_dir} authorize AUTHZ_FILE=public/authz_server/authorize --no-print-directory

	cd ${temp_dir} && ./scripts/wk.sh setup && cd -

	make -C ${temp_dir} up --no-print-directory
}

cleanup() {
	kill `cat ${temp_dir}/.credential_issuer.pid` && rm ${temp_dir}/.credential_issuer.pid
	kill `cat ${temp_dir}/.authz_server.pid` && rm ${temp_dir}/.authz_server.pid
	kill `cat ${temp_dir}/.relying_party.pid` && rm ${temp_dir}/.relying_party.pid
	rm -rf ${temp_dir}
}

"$@"
