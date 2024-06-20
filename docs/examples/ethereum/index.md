<!--
SPDX-FileCopyrightText: 2024 Dyne.org foundation

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

## ethereum plugin examples

### read the ethereum nonce
::: code-group
<<< @/examples/ethereum/read_nonce.zen{4 gherkin:line-numbers}
<<< @/examples/ethereum/read_nonce.data{json}
<<< @/examples/ethereum/read_nonce.keys{json}
:::

### read the ethereum transaction body
::: code-group
<<< @/examples/ethereum/read_bytes.zen{4 gherkin:line-numbers}
<<< @/examples/ethereum/read_bytes.data{json}
<<< @/examples/ethereum/read_bytes.keys{json}
:::

### read the ethereum balance
::: code-group
<<< @/examples/ethereum/read_balance.zen{3-4 gherkin:line-numbers}
<<< @/examples/ethereum/read_balance.data{json}
<<< @/examples/ethereum/read_balance.keys{json}
:::

### read the ethereum suggested gas price
::: code-group
<<< @/examples/ethereum/read_gas.zen{4 gherkin:line-numbers}
<<< @/examples/ethereum/read_gas.data{json}
<<< @/examples/ethereum/read_gas.keys{json}
:::


### read the ethereum transaction id after broadcast
::: code-group
<<< @/examples/ethereum/read_tx_id.zen{4 gherkin:line-numbers}
<<< @/examples/ethereum/read_tx_id.data{json}
<<< @/examples/ethereum/read_tx_id.keys{json}
:::

### read the ethereum transaction id after broadcast
::: code-group
<<< @/examples/ethereum/read_tx_id.zen{4 gherkin:line-numbers}
<<< @/examples/ethereum/read_tx_id.data{json}
<<< @/examples/ethereum/read_tx_id.keys{json}
:::

### complex example
::: code-group
<<< @/examples/ethereum/complex.zen{4,5,26 gherkin:line-numbers}
<<< @/examples/ethereum/complex.data{json}
<<< @/examples/ethereum/complex.keys{json}
:::

<!-- TODO: add erc20 and erc721 examples -->
