#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2024 Dyne.org foundation
#
# SPDX-License-Identifier: AGPL-3.0-or-later

oauth_test_dir="pkg/oauth/test/"
ms_test_dir="${oauth_test_dir}didroom_microservices"

setup() {
	if [ ! -d ${ms_test_dir} ]; then
		git clone https://github.com/ForkbombEu/DIDroom_microservices.git ${ms_test_dir} --quiet
	fi

	if [ ! -x ${ms_test_dir}/ncr ]; then
		wget -q --show-progress https://github.com/ForkbombEu/ncr/releases/download/v1.40.0/ncr -O ${ms_test_dir}/ncr
		chmod +x ${ms_test_dir}/ncr
	fi

	make -C ${ms_test_dir} test_custom_code --no-print-directory
	make -C ${ms_test_dir} authorize AUTHZ_FILE=public/authz_server/authorize --no-print-directory

	cd ${ms_test_dir} && ./scripts/wk.sh setup && cd -

	cp ${oauth_test_dir}/authz_server.keys.json ${ms_test_dir}/authz_server/secrets.keys
	sed -i "s|{{ as_did }}|did:dyne:sandbox.genericissuer:AueWh8vFf7Fmw1LKf5rqWHDDLw5SK1Lsm7NfUmerCurK|" ${ms_test_dir}/public/authz_server/.well-known/oauth-authorization-server
	cp ${oauth_test_dir}/credential_issuer.keys.json ${ms_test_dir}/credential_issuer/secrets.keys
	sed -i "s|{{ ci_did }}|did:dyne:sandbox.genericissuer:8jwiVEYfdkQ9xKxMpM4Z1xbtEkvG1kH9PXPCAKYA6BUG|" ${ms_test_dir}/public/credential_issuer/.well-known/openid-credential-issuer
	cp ${oauth_test_dir}/relying_party.keys.json ${ms_test_dir}/relying_party/secrets.keys
	sed -i "s|{{ rp_did }}|did:dyne:sandbox.genericissuer:9pSqYhma9FqbdStXiXDsn3LQ3L9N1Fjw5w6UnsJPXDo1|" ${ms_test_dir}/public/relying_party/.well-known/openid-relying-party

	make -C ${ms_test_dir} up --no-print-directory
}

cleanup() {
	kill `cat ${ms_test_dir}/.credential_issuer.pid` && rm ${ms_test_dir}/.credential_issuer.pid
	kill `cat ${ms_test_dir}/.authz_server.pid` && rm ${ms_test_dir}/.authz_server.pid
	kill `cat ${ms_test_dir}/.relying_party.pid` && rm ${ms_test_dir}/.relying_party.pid
	rm -rf ${ms_test_dir}
}

"$@"
