import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
    windowMs: 15 * 60 *1000,
    max: 5,
    message: {
        success: false,
        message: "Too many login attempts. Please try again later."
    },
    headers: true
})


const forgotPasswordLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many password reset requests. Please try again later."
    },
    headers: true
})

const Rate = { loginLimiter, forgotPasswordLimiter }

export default Rate;