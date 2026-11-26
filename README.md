# Screenshots and messages for the owner

This branch only holds the screenshots, sheets and messages sent to the owner,
so they can be reviewed from another chat. It is never merged into master.

- Pictures: shots/<date>/<job>/ (JPG, at most 1600 px wide, pictures only).
- Messages: messages/<date>/<HH-MM>-<job>.md, word for word, one file per
  message, ending with the picture folders it refers to. Times are UTC.
- Only the last 14 days are kept; when older days are removed the branch is
  rewritten (squashed), so old files leave the history.
