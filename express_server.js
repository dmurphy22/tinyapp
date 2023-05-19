const express = require("express");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const {generateRandomString, getUserByEmail, urlsForUser} = require("./helpers.js");
const app = express();
const cookieSession = require('cookie-session');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(cookieSession({
  name: 'session',
  keys: ["wubbalubbadubdub"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};


const users = {
  userRandomID: {
    id: "userRandomID",
    email: "a@a.com",
    password: "$2a$10$buevw/BPQxOkj6MmOoQ6xOAjn9Na8.yVVBO2og0cFVT35TIODfGla",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  Rgkz4I: {
    id: "Rgkz4I",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};



app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let id = req.session.user_id;
  if (!id)
    return res.redirect("/register");
  const user = users[id];



  const filteredURLs = urlsForUser(urlDatabase,user);

  const templateVars = { user: user, urls: filteredURLs, uid: id };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let id = req.session.user_id;
  if (!id)
    return res.redirect("/urls");
  const user = users[id];

  const templateVars = { user: user, urls: urlDatabase };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let id = req.session.user_id;
  const user = users[id];

  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(404).send("No such URL");
  }

  if (user.id !== url.userID) {
    return res.status(403).send("Forbidden");
  }

  const templateVars = { user: user, id: req.params.id, longURL: url.longURL};
  res.render("urls_show", templateVars);
});

app.get('/register', (req, res) => {
  let id = req.session.user_id;
  if (id)
    return res.redirect("/urls");
  const user = users[id];
  const templateVars = { user: user, urls: urlDatabase };
  res.render("register", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (!longURL)
    return res.status(404).send("Not Found!");
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let uid = req.session.user_id;
  if (!uid)
    return res.status(403).send("Forbidden!");

  let obj = {
    longURL: req.body["longURL"],
    userID: uid
  };
  
  const genID = generateRandomString(6);
  urlDatabase[genID] = obj;

  res.redirect(`/urls/${genID}`); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  let uid = req.session.user_id;
  const url = urlDatabase[id];
  const user = users[uid];
  if (!uid || user.id !== url.userID)
    return res.status(403).send("Forbidden!");

  if (urlDatabase[id])
    delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  let uid = req.session.user_id;
  if (!uid)
    return res.status(403).send("Forbidden!");

  let obj = {
    longURL: req.body["longURL"],
    userID: uid
  };

  if (urlDatabase[id])
    urlDatabase[id] = obj;
  res.redirect("back");
});

app.get("/login", (req,res) => {
  let id = req.session.user_id;
  const user = users[id];
  const templateVars = { user: user, urls: urlDatabase };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(users, email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(403).send("Incorrect username or password.");

  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Please enter both a password and an email. ");
  }

  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString(6);

  if (getUserByEmail(users, email)) {
    return res.status(400).send("User email already exists ");
  }

  let user = {};
  user.id = id;
  user.email = email;
  user.password = bcrypt.hashSync(password, 10);

  users[id] = user;

  req.session["user_id"] = id;

  res.redirect("back");

});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/login");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});