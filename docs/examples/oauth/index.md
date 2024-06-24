<!--
SPDX-FileCopyrightText: 2024 Dyne.org foundation

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

## oauth plugin examples

### generate request uri
::: code-group
<<< @/examples/oauth/gen_request_uri.zen{3 gherkin:line-numbers}
<<< @/examples/oauth/gen_request_uri.data{json}
<<< @/examples/oauth/gen_request_uri.keys{json}
:::

### verify request parameters
::: code-group
<<< @/examples/oauth/ver_request_params.zen{15 gherkin:line-numbers}
<<< @/examples/oauth/ver_request_params.data{json}
<<< @/examples/oauth/ver_request_params.keys{json}
:::

### add data to authorization details
::: code-group
<<< @/examples/oauth/add_data.zen{3 gherkin:line-numbers}
<<< @/examples/oauth/add_data.data{json}
<<< @/examples/oauth/add_data.keys{json}
:::

### generate authorization code
::: code-group
<<< @/examples/oauth/gen_auth_code.zen{3 gherkin:line-numbers}
<<< @/examples/oauth/gen_auth_code.data{json}
<<< @/examples/oauth/gen_auth_code.keys{json}
:::

### generate access token
::: code-group
<<< @/examples/oauth/gen_access_token.zen{12 gherkin:line-numbers}
<<< @/examples/oauth/gen_access_token.data{json}
<<< @/examples/oauth/gen_access_token.keys{json}
:::

### get authorization details
::: code-group
<<< @/examples/oauth/get_auth_details.zen{3 gherkin:line-numbers}
<<< @/examples/oauth/get_auth_details.data{json}
<<< @/examples/oauth/get_auth_details.keys{json}
:::
