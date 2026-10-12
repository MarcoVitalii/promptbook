# Security

Promptbook runs in the browser from one file. It has no server, no account and makes no network request; a show stays on the machine that opened it.

## What counts

- A show file (`.zip`), a cast file (`.cast.json`) or pasted text that makes the tool run script, or read or write outside the file the user chose.
- Anything that makes the tool send data anywhere.
- A change in the release workflow or in a dependency of the build that could alter the published files.

## Reporting

Please do not open a public issue. Use **Security → Report a vulnerability** on the repository page (GitHub private vulnerability reporting).

Only the latest release is fixed.
