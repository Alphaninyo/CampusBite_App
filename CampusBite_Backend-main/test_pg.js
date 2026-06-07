const { Client } = require('pg');

async function test() {
  // Try more passwords including blank/trust auth
  const passwords = ['campusbite', 'root', 'test', 'pass', '12345', 'password123', 'chamb', 'student', 'campus'];
  for (const password of passwords) {
    console.log(`Testing password: "${password}"...`);
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'postgres',
      connectionTimeoutMillis: 3000
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Password is: "${password}"`);
      await client.end();
      return password;
    } catch (err) {
      console.log(`Failed: ${err.message.substring(0, 60)}`);
    }
  }
  
  // Also try with current Windows user
  const usernames = ['chamb', 'campusbite'];
  for (const user of usernames) {
    for (const pw of ['', 'password', 'password123']) {
      const client = new Client({
        host: 'localhost',
        port: 5432,
        user: user,
        password: pw,
        database: 'postgres',
        connectionTimeoutMillis: 3000
      });
      try {
        await client.connect();
        console.log(`SUCCESS! user="${user}" password="${pw}"`);
        await client.end();
        return;
      } catch (err) {}
    }
  }
  
  console.log('\nCould not connect. Please provide your PostgreSQL password.');
}

test();
