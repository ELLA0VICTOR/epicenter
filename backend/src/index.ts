import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.backendPort, () => {
  console.log(`Epicenter backend listening on http://127.0.0.1:${env.backendPort}`);
});
