const postgres = require("postgres");

const sql = postgres({
  host: "localhost",
  port: 5432,
  database: "kelp",
  username: "om.jannu",
});

module.exports = sql;