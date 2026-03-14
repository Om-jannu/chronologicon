const app = require("./app");

const PORT = 3000;
const sql = require("./config/db");

(async () => {
  const result = await sql`SELECT NOW()`;
  console.log(result);
})();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});