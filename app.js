const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getQuery = `SELECT * FROM user where username = '${username}';`;
  const dbUser = await db.get(getQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addQuery = `INSERT INTO user(username,name,password,gender,location) values('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      const dbUser = await db.run(addQuery);
      response.send("User created Successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//LOGIN FEATURE API
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getQuery = `SELECT * FROM user where username = '${username}';`;
  const dbUser = await db.get(getQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/log/", async (request, response) => {
  const q = `select * from user;`;
  const gq = await db.all(q);
  response.send(gq);
});

//ChangePassword API
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getQuery = `SELECT * FROM user where username = '${username}';`;
  const dbUser = await db.get(getQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch === true) {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `update user set password = '${hashedNewPassword}' where username ='${username}';`;

      const dbUpdate = await db.run(updatePasswordQuery);

      response.send("password Updated Successfully");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
