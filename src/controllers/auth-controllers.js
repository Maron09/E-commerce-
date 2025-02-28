import User from "../models/User.js";
import userProfile from "../models/UserProfile.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import  "../helpers/env.js"
import sendEmail from "../helpers/email.js";
import UserAgent from "user-agents"
import geoip from "geoip-lite"
import crypto from "crypto"



class AuthControllers {

    static async RegisterUser (req, res, role) {
        try {
            const { firstName, lastName, email, password, phoneNumber, businessName } = req.body;

            const userExists = await User.findOne({email})

            if (userExists) {
                return res.status(400).json({
                    succes: false,
                    message: "User with this email already Exists"
                })
            }

            if (role === "VENDOR" && !businessName) {
                return res.status(400).json({
                    success: false,
                    message: "Business name is required for vendors"
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            const newUser = await User.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                verificationCode,
                businessName: role === "VENDOR" ? businessName : undefined 
            });

            if (!newUser) {
                return res.status(400).json({ success: false, message: "Failed to Register User" });
            }
    
            await sendEmail(email, 
                "Verify Your Email", 
                `<p>Your verification code is: <strong>${verificationCode}</strong></p>`);
    
            const profile = await userProfile.create({ 
                user: newUser._id, 
                phoneNumber 
            });
    
            return res.status(201).json({
                success: true,
                message: "User Registered. Check Your Email",
                data: {
                    newUser, 
                    profile
                }
            });

        } catch(error) {
            res.status(500).json({
                succes: false,
                message: "Internal Server Error", error
            })
        }
    }

    static async RegisterAdmin (req, res) {
        return AuthControllers.RegisterUser(req, res, "ADMIN")
    }

    static async RegisterVendor (req, res) {
        return AuthControllers.RegisterUser(req, res, "VENDOR")
    }

    static async RegisterCustomer (req, res) {
        return AuthControllers.RegisterUser(req, res, "CUSTOMER")
    }

    static async VerifyEmail (req, res) {
        try {
            const { code } = req.body

            const user = await User.findOne({
                verificationCode: code
            })
            if (!user) {
                return res.status(400).json({
                    succes: false,
                    message: "Invalid verification code"
                })
            }
            user.isVerified = true
            user.isActive = true
            user.verificationCode = null
            await user.save()

            return res.status(200).json({
                succes: true,
                message: "Email verified successfully. You can now log in."
            })
        } catch(error) {
            res.status(500).json({
                succes: false,
                message: "Error verifying email", error
            })
        }
    }

    static async Login (req, res) {
        try {
            const { email, password } = req.body

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email or password is required",
                })
            }

            const user = await User.findOne({ email })
            if (!user || !user.isVerified || !user.isActive) {
                return res.status(400).json({
                    succes: false,
                    message: "Invalid credentials or unverified email"
                })
            }

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return res.status(400).json({
                    succes: false,
                    message: "Invalid credentials"
                })
            }

            const token = jwt.sign({
                userID: user._id,
                email: user.email,
                role: user.role
            }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" })

            const userAgent = new UserAgent()
            const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress
            const location = geoip.lookup(ip)

            await sendEmail(
                user.email,
                "New Login Detected",
                `<p>You logged in from: <strong>${userAgent.toString()}</strong></p>
                <p>IP Address: <strong>${ip}</strong></p>
                <p>Location: <strong>${location ? `${location.city}, ${location.country}` : "Unknown"}</strong></p>`
            )

            return res.status(200).json({
                success: true,
                message: "Login Successful",
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                },
                acces_token: token
            })
        } catch(error) {
            console.log(error)
            res.status(500).json({
                succes: false,
                message: "Internal Server Error", error
            })
        }
    }

    static async ForgotPassword (req, res) {
        try {
            const { email } = req.body
            const user = await User.findOne({email})
            if (!user) {
                return res.status(404).json({
                    succes: false,
                    message: "User not Found"
                })
            }

            const resetToken = crypto.randomBytes(32).toString("hex")
            const hashToken = crypto.createHash("sha256").update(resetToken).digest("hex")
            user.resetPasswordToken = hashToken
            user.resetPasswordExpires = Date.now() + 15 * 60 * 1000
            await user.save()

            const resetURL = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;

            await sendEmail(
                email,
                "Password Reset",
                `<p>Click <a href="${resetURL}">here</a> to reset your password.</p>`
            )
            return res.status(200).json({
                succes: true,
                message: "Password reset email sent."
            })
        } catch(error) {
            res.status(500).json({
                succes: false,
                message: "Internal Server Error", error
            })
        }
    }

    static async ResetPassword (req, res) {
        try {
            const { token } = req.params
            const { newPassword } = req.body

            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

            const user = await User.findOne({
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { $gt: Date.now() }
            })

            if (!user) {
                return res.status(400).json({
                    succes: false,
                    message: "Invalid or expired token"
                })
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
            user.resetPasswordToken = undefined
            user.resetPasswordExpires = undefined

            await user.save()
            return res.status(200).json({
                succes: true,
                message: "Password reset Successfully"
            })
        } catch(error) {
            res.status(500).json({
                succes: false,
                message: "Internal Server Error", error
            })
        }
    }

    static async ChangePassword (req, res) {
        try {
            const userId = req.userInfo.userID

            const { oldPassword, newPassword } = req.body
            
            const user = await User.findById(userId)
            if (!user) {
                return res.status(404).json({
                    succes: false,
                    message: "user not found"
                })
            }

            const isPasswordMatch = await bcrypt.compare(oldPassword, user.password)
            if (!isPasswordMatch) {
                return res.status(400).json({
                    succes: false,
                    message: "Wrong current Password"
                })
            }

            const salt = await bcrypt.genSalt(10)
            const hashedNewPassword = await bcrypt.hash(newPassword, salt)

            user.password = hashedNewPassword
            await user.save()

            return res.status(200).json({
                succes: true,
                message: "Password changed Successfully"
            })
        } catch(error) {
            res.status(500).json({
                succes: false,
                message: "Internal Server Error", error
            })
        }
    }
}


export default AuthControllers;