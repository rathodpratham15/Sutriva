# Sutriva

Temporal memory for coding agents -- see `README.md` for the full picture.

## When asked "what happened?" or similar

This repo's whole purpose is being asked exactly this question. If a user asks something like
"what happened?", "what just happened?", or "look at this" without further context, **check for an
active Sutriva live session first** (`inspect_environment`'s `liveSession` field, or just call
`get_current_context`) before assuming they mean recent git/project history. A live session
being active is a strong signal they mean the live debugging session, not the repo's commit log --
only fall back to git history if no live session is running.

See `.claude/commands/debug-video.md` for the full debugging workflow this applies to.
