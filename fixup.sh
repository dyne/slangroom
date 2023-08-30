#!/bin/env bash

for f in pkg/*; do
	cat <<EOF > ${f}/build/cjs/package.json
{
	"type": "commonjs"
}
EOF
done
