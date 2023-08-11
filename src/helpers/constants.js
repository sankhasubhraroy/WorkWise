// User Roles
const ROLE = {
  ADMIN: "admin",
  CONSUMER: "consumer",
  FREELANCER: "freelancer",
};

// Work Statuses
const WORK_STATUS = {
  REQUESTED: "requested", // freelancer requested a offer
  ACCEPTED: "accepted",   // consumer accepted the offer
  REJECTED: "rejected",   // consumer rejected the offer
  FAILED: "failed",       // freelancer failed to complete the work within deadline
  COMPLETED: "completed", // freelancer completed the work within deadline or extended deadline
};

// Payment Statuses
const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
};

// Avatar Image Size for DiceBear Avatars
const AVATAR_IMAGE_SIZE = 200;
const DEFAULT_AVATAR = (name) => `https://avatars.dicebear.com/api/initials/${name}.svg?size=${AVATAR_IMAGE_SIZE}`

// Regular Expressions for Validations
const NAME_REGEX = /^[a-zA-Z-\s]+$/
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const USERNAME_REGEX = /^[a-zA-Z0-9]+$/
const PHONE_REGEX = /^((\+91)?|91?|0)?[789][0-9]{9}$/
const PASSWORD_REGEX = /^(?=.[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/

// Google Scopes for Google OAuth
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
]

// Google callback URL for Google OAuth
const GOOGLE_CALLBACK_URL = (user) => `http://localhost:5000/api/auth/${user}/google/callback`;

module.exports = {
  ROLE,
  WORK_STATUS,
  PAYMENT_STATUS,
  AVATAR_IMAGE_SIZE,
  DEFAULT_AVATAR,
  NAME_REGEX,
  EMAIL_REGEX,
  USERNAME_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX,
  GOOGLE_SCOPES,
  GOOGLE_CALLBACK_URL,
};
