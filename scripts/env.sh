# Sourced by the scripts here: puts the fnm default Node on PATH when the shell has not done it (hooks, cron, git).
command -v node >/dev/null 2>&1 || PATH="$HOME/.local/share/fnm/aliases/default/bin:$PATH"
export PATH
