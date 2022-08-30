# ChaturbateWebSocket
### by ChaturbateExtensions

This is a standalone NodeJS project to monitor the chat websocket for the top models on Chaturbate.  It uses Puppeteer to load a minimal webpage to get the websocket, and then connects to the websocket.  It currently tracks which models get tips and then sends the log to a local EJS server to compile it to a csv.
