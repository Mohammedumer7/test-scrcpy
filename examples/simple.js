const Scrcpy = require("../lib/scrcpy");

const scrcpy = new Scrcpy();

const http = require("http");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server running");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("WebSocket connected");

  // Handle data received from scrcpy
  scrcpy.on("data", (pts, data) => {
    // Send the data as a message to connected WebSocket clients
    console.log(data);
    ws.send(data);
  });

  ws.on("close", () => {
    console.log("WebSocket closed");
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

scrcpy
  .start()
  .then((info) =>
    console.log(`Started -> ${info.name} at ${info.width}x${info.height}`)
  )
  .catch((e) => console.error("Impossible to start", e));
