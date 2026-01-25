#!/usr/bin/env node
// Generated: 2026-01-25 10:20:00 KST

const oracledb = require("oracledb");
const fs = require("fs");
const path = require("path");

(async () => {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: "sunjin_admin",
      password: "sunjin1234",
      connectionString: "192.168.75.194:1521/XEPDB1"
    });

    const sqlFile = path.join(__dirname, "init-database.sql");
    const sql = fs.readFileSync(sqlFile, "utf-8");

    console.log("데이터베이스를 초기화 중입니다...\n");

    // Split SQL statements and execute each one
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      try {
        await conn.execute(statement);
        console.log("✓", statement.substring(0, 50) + "...");
      } catch (e) {
        // Ignore "table already exists" and similar errors
        if (e.message.includes("ORA-00955") || e.message.includes("ORA-02261")) {
          console.log("- ", statement.substring(0, 50) + "... (이미 존재)");
        } else {
          console.error("✗", statement.substring(0, 50) + "...");
          console.error("  Error:", e.message);
        }
      }
    }

    await conn.commit();
    console.log("\n✓ 데이터베이스 초기화 완료");
  } catch (err) {
    console.error("오류: " + err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
  }
})();
