const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${env.port}`);
});
