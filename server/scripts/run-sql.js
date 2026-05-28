const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

async function run() {
  const relativeSqlPath = process.argv[2];
  if (!relativeSqlPath) {
    throw new Error("Usage: node scripts/run-sql.js <path-to-sql>");
  }

  const sqlPath = path.resolve(__dirname, relativeSqlPath);
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);
  await pool.end();
  // eslint-disable-next-line no-console
  console.log(`Executed SQL: ${sqlPath}`);
}

run().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await pool.end();
  process.exit(1);
});
