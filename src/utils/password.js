const bcrypt = require("bcrypt");

exports.hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) return reject(err);
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  });
};


exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
