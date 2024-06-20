<!--
SPDX-FileCopyrightText: 2024 Dyne.org foundation

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

## db plugin examples

### execute generic sql statements
::: code-group
<<< @/examples/db/sql_statement.zen{3 gherkin:line-numbers}
<<< @/examples/db/sql_statement.data{json}
<<< @/examples/db/sql_statement.keys{json}
:::

### execute generic sql statements with parameters
::: code-group
<<< @/examples/db/sql_statement_with_params.zen{3 gherkin:line-numbers}
<<< @/examples/db/sql_statement_with_params.data{json}
<<< @/examples/db/sql_statement_with_params.keys{json}
:::

### read a record from a table
::: code-group
<<< @/examples/db/read_from_table.zen{3 gherkin:line-numbers}
<<< @/examples/db/read_from_table.data{json}
<<< @/examples/db/read_from_table.keys{json}
:::

### save a variable in a database table
::: code-group
<<< @/examples/db/save_to_table.zen{12 gherkin:line-numbers}
<<< @/examples/db/save_to_table.data{json}
<<< @/examples/db/save_to_table.keys{json}
:::
