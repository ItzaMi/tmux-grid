# tmux-grid

> Visual layout builder for [tmux](https://github.com/tmux/tmux).

`tmux-grid` is a small web app for designing tmux sessions. You arrange panes in a grid, assign a command to each one, and it outputs a shell script that recreates the layout when you run it.

## Why

tmux layouts are configured through `split-window` commands with flags, percentages, and pane indexes. It works, but it's hard to visualize what you're building and easy to get wrong. `tmux-grid` lets you see the layout while you build it, so the script is the output, not the source.
