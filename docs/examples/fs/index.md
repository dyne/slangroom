<!--
SPDX-FileCopyrightText: 2024 Dyne.org foundation

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

## fs plugin examples

### read json file
::: code-group
<<< @/examples/fs/read_json.zen{2 gherkin:line-numbers}
<<< @/examples/fs/read_json.data{json}
<<< @/examples/fs/read_json.keys{json}
:::

### read string file
::: code-group
<<< @/examples/fs/read_verbatim.zen{2 gherkin:line-numbers}
<<< @/examples/fs/read_verbatim.data{json}
<<< @/examples/fs/read_verbatim.keys{json}
:::

### store in file
::: code-group
<<< @/examples/fs/store.zen{6 gherkin:line-numbers}
<<< @/examples/fs/store.data{json}
<<< @/examples/fs/store.keys{json}
:::

### list a directory content
::: code-group
<<< @/examples/fs/ls.zen{2 gherkin:line-numbers}
<<< @/examples/fs/ls.data{json}
<<< @/examples/fs/ls.keys{json}
:::

### verify file exists or does not exist
::: code-group
<<< @/examples/fs/exist.zen{2,3 gherkin:line-numbers}
<<< @/examples/fs/exist.data{json}
<<< @/examples/fs/exist.keys{json}
:::
