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

const getUserByEmail = function(usersDB, email) {

  for (const userId in usersDB) {
    const user = usersDB[userId];
    if (user.email === email) {
      return user;
    }
  }
  return undefined;

};

const urlsForUser = function(urlDB, user) {
  let filteredURLs = {};
  for (let url in urlDB) {
    if (urlDB[url].userID === user.id) {
      let filtered = {
        longURL: urlDB[url].longURL,
        userID: urlDB[url].userID,
        clicks: urlDB[url].clicks
      };
      filteredURLs[url] = filtered;
    }
  }
  return filteredURLs;
};

module.exports = {generateRandomString, getUserByEmail, urlsForUser};