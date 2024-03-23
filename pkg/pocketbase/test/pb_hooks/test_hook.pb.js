// SPDX-FileCopyrightText: 2024 Dyne.org foundation
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// eslint-disable-next-line
routerAdd(
    "GET",
    "/api/hello/:name",
    (c) => {
        let name = c.pathParam("name");

        return c.json(200, { message: "Hello " + name });
    }
);
