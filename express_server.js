const express = require("express");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const {generateRandomString, getUserByEmail, urlsForUser} = require("./helpers.js");
const app = express();
const cookieSession = require('cookie-session');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(methodOverride('_method'));

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
    clicks: 0
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    clicks: 0
  },
};

const visits = {
  timestamp: "",
  visitorId: ""
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


// -----------------------
//Json Routes
// -----------------------
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

// -----------------------
//Index route
// -----------------------
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// -----------------------
//Main /urls Routes
// -----------------------
app.get("/urls", (req, res) => {
  let id = req.session.user_id;
  if (!id || !users[id]) {
    res.clearCookie("session");
    return res.status(404).render("error", {error: "Please login to view your URLS"});
  }
  const user = users[id];
  const filteredURLs = urlsForUser(urlDatabase, user);

  const uniqueVisitors = {};
  for (const urlId in urlDatabase) {
    const visitors = visits[urlId];
    uniqueVisitors[urlId] = visitors ? visitors.size : 0;
  }

  const templateVars = { user: user, urls: filteredURLs, uid: id, uniqueVisitors: uniqueVisitors };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let id = req.session.user_id;
  if (!id)
    return res.redirect("/login");
  const user = users[id];

  const templateVars = { user: user, urls: urlDatabase };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let id = req.session.user_id;
  const user = users[id];

  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(404).render("error", {error: "No such URL"});
  }

  if (!user || user.id !== url.userID) {
    return res.status(404).render("error", {error: "Forbidden"});
  }

  const uniqueVisitors = visits[req.params.id] ? visits[req.params.id].size : 0;

  const templateVars = { user: user, id: req.params.id, longURL: url.longURL, clicks: url.clicks, uniqueVisitors: uniqueVisitors};
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  let uid = req.session.user_id;
  if (!uid)
    return res.status(404).render("error", {error: "Forbidden!"});

  let obj = {
    longURL: req.body["longURL"],
    userID: uid,
    clicks: 0
  };
  
  const genID = generateRandomString(6);
  urlDatabase[genID] = obj;

  res.redirect(`/urls/${genID}`);
});

app.delete("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  let uid = req.session.user_id;
  const url = urlDatabase[id];
  const user = users[uid];
  if (!uid || user.id !== url.userID)
    return res.status(404).render("error", {error: "Forbidden!"});

  if (urlDatabase[id])
    delete urlDatabase[id];
  res.redirect("/urls");
});

app.put("/urls/:id", (req, res) => {
  const id = req.params.id;
  let uid = req.session.user_id;
  if (!uid)
    return res.status(404).render("error", {error: "Forbidden!"});

  let obj = {
    longURL: req.body["longURL"],
    userID: uid
  };

  if (urlDatabase[id])
    urlDatabase[id] = obj;
  res.redirect("/urls");
});

// -----------------------
//Register and Login / Logout routes
// -----------------------
app.get('/register', (req, res) => {
  let id = req.session.user_id;
  if (id)
    return res.redirect("/urls");
  const user = users[id];
  const templateVars = { user: user, urls: urlDatabase };
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(404).render("error", {error: "Please enter both a password and an email."});
    
  }

  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString(6);

  if (getUserByEmail(users, email)) {
    return res.status(404).render("error", {error: "User email already exists "});
    
  }

  let user = {};
  user.id = id;
  user.email = email;
  user.password = bcrypt.hashSync(password, 10);

  users[id] = user;

  req.session["user_id"] = id;

  res.redirect("/urls");

});

app.get("/login", (req,res) => {
  let id = req.session.user_id;
  if (id) {
    res.redirect("/urls");
  }
  const user = users[id];
  const templateVars = { user: user, urls: urlDatabase };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(users, email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(404).render("error", {error: "Incorrect username or password."});

  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/login");

});

// -----------------------
//Redirect Route
// -----------------------
app.get("/u/:id", (req, res) => {
  const url = urlDatabase[req.params.id];

  if (!url)
    return res.status(404).render("error", {error: "Not Found!"});

  const visitorId = req.session.visitor_id;
  if (!visitorId) {
    const generatedId = generateRandomString(6);
    req.session.visitorId = generatedId;
    visits[req.params.id] = new Set();
    visits[req.params.id].add(generatedId);
    url.clicks++;
  } else if (!visits[req.params.id].has(visitorId)) {
    visits[req.params.id].add(visitorId);
    url.clicks++;
  }

  res.redirect(url.longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});