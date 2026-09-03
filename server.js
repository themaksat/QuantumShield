const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = false;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.once("error", (err) => {
      console.error("Server error:", err);
      process.exit(1);
    });

    server.listen(port, hostname, () => {
      console.log(`> QuantumShield running at http://${hostname}:${port}`);
      console.log(`> Local access: http://localhost:${port}`);
    });

    // Prevent premature process termination
    setInterval(() => {}, 3600000);
  })
  .catch((err) => {
    console.error("Failed to prepare Next.js app:", err);
    process.exit(1);
  });
