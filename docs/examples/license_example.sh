#!/bin/env bash

for file in **/*; do
	# Create a new filename with the license extension
	license_file="${file}.license"
	ext=${file##*.}
	if [[ "$ext" == "zen" || "$ext" == "keys" || "$ext" == "data" ]]; then
		if [[ ! -f "$license_file" ]]; then
			# Add the license text to the new license file
			printf "SPDX-FileCopyrightText: 2024 Dyne.org foundation\n\nSPDX-License-Identifier: AGPL-3.0-or-later\n" > "$license_file"
		fi
	fi
done
