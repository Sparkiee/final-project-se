import axios from "axios";

const verifyRecaptcha = async (req, res, next) => {
    // Skip verification if stress testing is active
    if (process.env.STRESS_TEST_ACTIVE === "true") {
        // Log the bypass for stress testing 
        // Skipping reCAPTCHA verification due to stress testing mode
        return next();
    }

    const recaptchaToken = req.body.recaptchaToken;

    if (!recaptchaToken) {
        return res.status(400).json({ message: "reCAPTCHA token is missing" });
    }

    if (!process.env.RECAPTCHA_SECRET_KEY) {
        console.error("RECAPTCHA_SECRET_KEY is not set in the environment variables");
        return res.status(500).json({ message: "Server configuration error" });
    }

    try {
        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
        );

        const { success, "error-codes": errorCodes } = response.data;

        if (!success) {
            console.error("reCAPTCHA verification failed:", errorCodes);
            return res.status(400).json({ message: "reCAPTCHA verification failed", errorCodes });
        }

        next();
    } catch (error) {
        console.error("reCAPTCHA verification error:", error.message);
        return res.status(500).json({ message: "reCAPTCHA verification error. Please try again later." });
    }
};

export default verifyRecaptcha;
