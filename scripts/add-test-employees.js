#!/usr/bin/env node
const oracledb = require("oracledb");
const bcrypt = require("bcryptjs");

(async () => {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: "sunjin_admin",
      password: "sunjin1234",
      connectionString: "192.168.75.194:1521/XEPDB1"
    });

    // First, check what columns exist in the EMPLOYEE table
    const columnsResult = await conn.execute(
      "SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'EMPLOYEE' ORDER BY COLUMN_ID"
    );
    const columns = columnsResult.rows.map(row => row[0]);
    console.log("Available columns: " + columns.join(", "));

    const hash = await bcrypt.hash("password123", 10);

    const employees = [
      { id: 2, name: "김철수", username: "kim", email: "kim@sunjin.co.kr" },
      { id: 3, name: "이영희", username: "lee", email: "lee@sunjin.co.kr" },
      { id: 4, name: "박민준", username: "park", email: "park@sunjin.co.kr" },
      { id: 5, name: "정수현", username: "jeong", email: "jeong@sunjin.co.kr" },
      { id: 6, name: "최준호", username: "choi", email: "choi@sunjin.co.kr" }
    ];

    console.log("테스트 직원을 등록 중입니다...\n");
    let added = 0;

    for (const emp of employees) {
      try {
        await conn.execute(
          "INSERT INTO SUNJIN_ADMIN.EMPLOYEE (id, name, username, password_hash, role, email, position) " +
          "VALUES (:id, :name, :username, :hash, 'USER', :email, '과장')",
          {
            id: emp.id,
            name: emp.name,
            username: emp.username,
            hash: hash,
            email: emp.email
          }
        );
        console.log("✓ " + emp.name);
        added++;
      } catch (e) {
        if (e.message.includes("ORA-00001")) {
          console.log("- " + emp.name + " (이미 존재)");
        } else {
          console.error("✗ " + emp.name + ": " + e.message);
        }
      }
    }

    if (added > 0) {
      await conn.commit();
      console.log("\n" + added + "명이 새로 추가되었습니다");
    } else {
      console.log("\n새로 추가된 직원이 없습니다");
    }

    // Verify
    const result = await conn.execute(
      "SELECT id, name FROM SUNJIN_ADMIN.EMPLOYEE WHERE deleted_at IS NULL ORDER BY id"
    );
    console.log("\n=== 등록된 직원 목록 (총 " + result.rows.length + "명) ===");
    for (const row of result.rows) {
      console.log("[" + row[0] + "] " + row[1]);
    }

  } catch (err) {
    console.error("오류: " + err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.close();
  }
})();
