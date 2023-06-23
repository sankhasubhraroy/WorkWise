const {
  NAME_REGEX,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX,
} = require("./constants");

exports.isNameValid = (name) => {
  if (!name) return false;
  if (name.length < 3) return false;

  const isValid = NAME_REGEX.test(name);
  if (!isValid) return false;

  return true;
};

exports.isEmailValid = (email) => {
  if (!email) return false;
  if (email.length > 254) return false;

  const isValid = EMAIL_REGEX.test(email);
  if (!isValid) return false;

  const parts = email.split("@");
  if (parts[0].length > 64) return false;

  return true;
};

exports.isUsernameValid = (username) => {
  if (!username) return false;
  if (username.length < 3) return false;

  const isValid = USERNAME_REGEX.test(username);
  if (!isValid) return false;

  return true;
};

exports.isPhoneValid = (phone) => {
  if (!phone) return false;

  const isValid = PHONE_REGEX.test(phone);
  if (!isValid) return false;

  return true;
};

exports.isPasswordValid = (password) => {
  if (!password) return false;

  const isValid = PASSWORD_REGEX.test(password);
  if (!isValid) return false;

  return true;
};
