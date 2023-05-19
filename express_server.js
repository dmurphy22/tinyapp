const express = require("express");
const morgan = require('morgan');
const app = express();
const cookieParser = require('cookie-parser');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

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
    password: "1111",
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



app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let id = req.cookies["user_id"];
  const user = users[id];

  const filteredURLs = urlsForUser(user);

  const templateVars = { user: user, urls: filteredURLs, uid: id };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let id = req.cookies["user_id"];
  if (!id)
    return res.redirect("/urls");
  const user = users[id];

  const templateVars = { user: user, urls: urlDatabase };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let id = req.cookies["user_id"];
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
  let id = req.cookies["user_id"];
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
  let uid = req.cookies["user_id"];
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
  let uid = req.cookies["user_id"];
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
  let uid = req.cookies["user_id"];
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
  let id = req.cookies["user_id"];
  const user = users[id];
  const templateVars = { user: user, urls: urlDatabase };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email);
  if (!user || password !== user.password)
    return res.status(403).send("Incorrect username or password.");


  res.cookie("user_id", user.id);
  res.redirect("/urls");

});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Please enter both a password and an email. ");
  }


  const email = req.body.email;
  const password = req.body.password;
  const id = generateRandomString(6);

  if (getUserByEmail(email)) {
    return res.status(400).send("User email already exists ");
  }


  let user = {};

  user.id = id;
  user.email = email;
  user.password = password;

  users[id] = user;

  res.cookie("user_id", id);

  res.redirect("back");

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


const generateRandomString = function(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;

};

const getUserByEmail = function(email) {

  for (const userId in users) {
    const user = users[userId];

    if (user.email === email)
      return user;
  }

};

const urlsForUser = function(user) {
  let filteredURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === user.id) {
      let filtered = {
        longURL: urlDatabase[url].longURL,
        userID: urlDatabase[url].userID
      };
      filteredURLs[url] = filtered;
    }
  }
  return filteredURLs;
};