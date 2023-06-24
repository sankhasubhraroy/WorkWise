const Freelancer = require("../../models/freelancer");
const OTP = require('../../models/otp');
const { encryptData, decryptData } = require("../../helpers/encrypt");
const crypto = require('crypto');
const {
    isNameValid,
    isEmailValid,
    isUsernameValid,
    isPhoneValid,
    isPasswordValid
} = require("../../helpers/validations");
const { ROLE } = require("../../helpers/constants");
const { google } = require("googleapis");
const { generateJWT } = require("../../helpers/generateJWT");
const { generateUsername } = require("../../helpers/generateUsername");
const sendMail = require("../../helpers/sendMail");
const getOTPContent = require("../../utils/otpContent");
const getResetPasswordContent = require("../../utils/resetPasswordContent");
const GOOGLE_REDIRECT_URL = "http://localhost:5000/api/auth/freelancer/google/callback";
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URL
);

exports.validateFreelancer = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.user.id).select("-password -createdAt -updatedAt");
        res.status(200).send({
            success: true,
            message: "Valid",
            freelancer
        });
    } catch (error) {
        return res.status(500).send({
            success: false,
            message: error.message
        });
    }
}

// register fnction || method POST
exports.register = async (req, res) => {
    try {
        const { name, email, username, phone, password } = req.body;

        // validations
        if (!isNameValid(name)) {
            return res.status(400).send({
                success: false,
                message: "Please enter a valid name"
            });
        }
        if (!isEmailValid(email)) {
            return res.status(400).send({
                success: false,
                message: "Please enter a valid email address"
            });
        }
        if (!isUsernameValid(username)) {
            return res.status(400).send({
                success: false,
                message: "Username should not contain any special characters"
            });
        }
        if (!isPhoneValid(phone)) {
            return res.status(400).send({
                success: false,
                message: "Please enter a valid phone number"
            });
        }
        if (!isPasswordValid(password)) {
            return res.status(400).send({
                success: false,
                message: "Password must contain at least 8 characters, one letter and one number"
            });
        }

        // checking is freelancer already exists
        const existingFreelancer = await Freelancer.findOne({ $or: [{ email }, { username }, { phone }] });

        // When freelancer already exists
        if (existingFreelancer) {
            return res.status(400).send({
                success: false,
                message: "Account already exists"
            });
        }

        // Encrypting the password
        const hashedPassword = await encryptData(password);

        // Generating an avatar
        const size = 200;
        const avatar = `https://avatars.dicebear.com/api/initials/${name}.svg?size=${size}`;

        // Saving Freelancer to database
        const freelancer = await new Freelancer({
            name,
            email,
            username,
            phone,
            password: hashedPassword,
            avatar
        }).save();

        // Creating a payload to store it on JWT
        const payload = {
            user: {
                id: freelancer.id,
                type: ROLE.FREELANCER
            }
        }

        // Generating a JWT token to validate the user
        const token = await generateJWT(payload);

        // Generating a randome key and saving it to database for email verification
        const otp = await new OTP({
            userId: freelancer.id,
            key: crypto.randomBytes(32).toString("hex")
        }).save();

        const content = getOTPContent("freelancer", otp);

        console.log("is Success:", await sendMail(freelancer.email, "Verify Email", content));

        res.status(200).send({
            success: true,
            message: "User Register Successfully",
            token,
            user: freelancer,
            type: ROLE.FREELANCER
        });

    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// login function || method POST
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // validations
        if (!email || !password) {
            return res.status(400).send({
                success: false,
                message: "Invalid email or password"
            });
        }

        // fetching freelancer data
        const freelancer = await Freelancer.findOne({ email });

        // when freelancer don't exists
        if (!freelancer) {
            return res.status(400).send({
                success: false,
                message: "Account dosen't exists, create a new account"
            });
        }

        // comparing the password with database encrypted password
        const isMatch = await decryptData(password, freelancer.password);

        if (!isMatch) {
            return res.status(200).send({
                success: false,
                message: "Incorrect Password",
            });
        }

        // Create a paylaod to store it on JWT
        const payload = {
            user: {
                id: freelancer.id,
                type: ROLE.FREELANCER
            }
        }

        // Generating a JWT token and sending it
        const token = await generateJWT(payload);

        res.status(200).send({
            success: true,
            message: "Login successful",
            token,
            user: freelancer,
            type: ROLE.FREELANCER
        });

    } catch (error) {
        res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// generating google auth url
exports.loginWithGoogle = (req, res) => {
    try {
        // generate a url that asks permissions for [profile] and email scopes
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: scopes
        });

        res.redirect(authUrl);

    } catch (error) {
        res.status(500).send({
            success: false,
            message: error.message
        });
    }
}

exports.googleCallback = async (req, res) => {
    try {
        const { tokens } = await oauth2Client.getToken(req.query.code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({
            auth: oauth2Client,
            version: "v2"
        });

        // get user info
        const { data } = await oauth2.userinfo.get();

        const userData = {
            name: data.name,
            email: data.email,
            username: await generateUsername(Freelancer, data.name),
            googleId: data.id,
            avatar: data.picture,
            emailVerified: data.verified_email
        };
        createFreelancer(userData, res);

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const createFreelancer = async (userData, res) => {
    try {
        const { email } = userData;

        // checking is freelancer already exists
        let freelancer = await Freelancer.findOne({ email });

        // When freelancer don't exists creating a new account
        if (!freelancer) {
            freelancer = await new Freelancer(userData).save();
        }

        // Creating a payload to store it on jwt
        const payload = {
            user: {
                id: freelancer.id,
                type: ROLE.FREELANCER
            }
        };

        // Generating a token to validate the user
        const token = await generateJWT(payload);

        return res.status(200).send({
            success: true,
            message: "User Logged in Successfully",
            token,
            user: freelancer,
            type: ROLE.FREELANCER
        });

    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// function to verify the OTP previously sent to email || method GET
exports.verifyEmail = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.query.id);

        // When no freelancer exists by this id
        if (!freelancer) {
            return res.status(400).send({
                success: false,
                message: "Invalid link"
            });
        }

        // When the freelancer is already verified
        if (freelancer.emailVerified) {
            return res.status(400).send({
                success: false,
                message: "Already verified"
            });
        }

        // When freelancer exists by that id, checking if the key is valid or not
        const otp = await OTP.findOne({
            userId: req.query.id,
            key: req.query.key
        });

        // when key doesn't exists || may have expired
        if (!otp) {
            return res.status(400).send({
                success: false,
                message: "Invalid OTP or may have expired"
            });
        }

        // Updating freelancer data when OTP is valid
        await freelancer.updateOne({ emailVerified: true });

        // removing the OTP after verification
        await OTP.findByIdAndRemove(otp.id);

        res.status(200).send({
            success: true,
            message: "Email id successfully verified"
        });

    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// Function for sesending the OTP again || method GET
exports.resendVerificationEmail = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.user.id).select("-password");

        // When freelancer don't exists
        if (!freelancer) {
            return res.status(400).send({
                success: false,
                message: "Server error"
            });
        }

        // When the freelancer is already verified
        if (freelancer.emailVerified) {
            return res.status(400).send({
                success: false,
                message: "Email already verified"
            });
        }

        // checking if there any existing OTP related with same user
        const existingOTP = await OTP.findOne({ userId: freelancer.id });

        // Removing the existing OTP
        if (existingOTP) {
            await OTP.findByIdAndRemove(existingOTP.id);
        }

        // Generating new randome key and saving it to database for email verification
        const otp = await new OTP({
            userId: freelancer.id,
            key: crypto.randomBytes(32).toString("hex")
        }).save();

        const content = getOTPContent("freelancer", otp);

        console.log("is Success:", await sendMail(freelancer.email, "Verify Email", content));

        res.status(200).send({
            success: true,
            message: "Verification link send successfully"
        });

    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// Function to send a link to email for reseting the password || method POST
exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // validations
        if (!email) {
            return res.status(400).send({
                success: false,
                message: "Email is required"
            });
        }

        // checking freelancer exists or not
        const freelancer = await Freelancer.findOne({ email });

        if (!freelancer) {
            return res.status(400).send({
                success: false,
                message: "Account doesn't exists"
            });
        }

        // checking if previous OTPs exists related to this freelancer
        const existingOTP = await OTP.findOne({ userId: freelancer.id });

        // Removing the existing OTP
        if (existingOTP) {
            await OTP.findByIdAndRemove(existingOTP.id);
        }

        // Generating new randome key and saving it to database for password reset
        const otp = await new OTP({
            userId: freelancer.id,
            key: crypto.randomBytes(32).toString("hex")
        }).save();

        const content = getResetPasswordContent("freelancer", otp);

        console.log("is Success:", await sendMail(freelancer.email, "Reset Password", content));

        res.status(200).send({
            success: true,
            message: "Password reset link send successfully"
        });

    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// Function to reset the password || method GET
exports.resetPassword = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.query.id);

        // When no freelancer exists by this id
        if (!freelancer) {
            return res.status(400).send({
                success: false,
                message: "Invalid link"
            });
        }

        // When freelancer exists by that id, checking if the key is valid or not
        const otp = await OTP.findOne({
            userId: req.query.id,
            key: req.query.key
        });

        // when key doesn't exists || may have expired
        if (!otp) {
            return res.status(400).send({
                success: false,
                message: "Invalid link or may have expired"
            });
        }

        // encrypting the password and updating freelancer when link is valid
        const password = req.body.password;
        const hashedPassword = await encryptData(password);

        await freelancer.updateOne({ password: hashedPassword });

        // removing the OTP after reseting the password
        await OTP.findByIdAndRemove(otp.id);

        res.status(200).send({
            success: true,
            message: "Password reset successfully"
        });

    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
}

// Logout function || method GET
exports.logout = async (req, res) => {
    try {
        const freelancer = await Freelancer.findById(req.user.id).select("-password");
        res.status(200).send({
            success: true,
            message: "User logged out",
            user: freelancer
        });

    } catch (error) {
        return res.status(400).send({
            success: false,
            message: error.message
        });
    }
}