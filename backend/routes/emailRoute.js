import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/users.js";

const router = express.Router();

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: "No user found with that email" });
    }

    // Generate a token and set expiration
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1800000; // 30 minutes
    await user.save();

    // Create a Nodemailer transporter
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Create the reset URL – adjust FRONTEND_URL to your client URL
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Set up email options
    let mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "בקשה לאיפוס סיסמה - מערכת לניהול פרויקטים",
      html: `
    <html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>איפוס סיסמה</title>
  </head>
  <body>
    <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px">
      <div style="display: flex; align-items: center; align-items: center;">
        <h4 style="color: #464bd8">מערכת לניהול פרויקטים</h4>
        <img
          src="https://i.postimg.cc/bNtFxdXh/project-management-logo.png"
          alt="Project Management Logo"
          style="height: 50px" />
      </div>
      <hr />
      <h2 style="color: #333; text-align: center">איפוס סיסמה</h2>
      <p>שלום ${user.name}</p>
      <p>שכחת סיסמה? פשוט לחצו על הקישור למטה ותוכלו להגדיר סיסמה חדשה.</p>
      <p style="text-align: center">
        <a
          href="${resetLink}"
          style="
            display: inline-block;
            padding: 10px 15px;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            border-radius: 3px;
          ">
          איפוס סיסמה
        </a>
      </p>
      <p>
        לצורכי אבטחה, הלינק הזה יפוג תוך 30 דקות או אחרי איפוס הסיסמה. אם לא ביקשת שינוי סיסמה, ניתן להתעלם מהודעה זאת.
      </p>
      <hr />
      <p>אם לחיצה על הכפתור לא עובדת, תעתיקו את הלינק לדפדפן.</p>
      <p>${resetLink}</p>
    </div>
  </body>
</html>
  `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.json({ message: "Password reset email sent" });
    } catch (error) {
      console.error("Error sending password reset mail:", error);
      return res.status(500).json({ message: "Error sending email" });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/create-user", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    // Create a Nodemailer transporter
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    // Set up email options
    let mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "כניסה למערכת - מערכת לניהול פרויקטים",
      html: `
    <html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <title>ברוך הבא!</title>
  </head>
  <body>
    <div style="direction: rtl; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px">
      <div style="display: flex; align-items: center; align-items: center;">
        <h4 style="color: #464bd8">מערכת לניהול פרויקטים</h4>
        <img
          src="https://i.postimg.cc/bNtFxdXh/project-management-logo.png"
          alt="Project Management Logo"
          style="height: 50px" />
      </div>
      <hr />
      <h2 style="color: #333; text-align: center">ברוך הבא!</h2>
      <p>שלום ${user.name},</p>
      <p>חשבון במערכת לניהול פרויקטים נוצר עבורך.</p>
      <p>בהתחברות ראשונה לאתר יהיה עלייך לבצע שינוי סיסמה ראשונית.</p>
      <p><strong>אימייל:</strong> ${user.email}</p>
      <p><strong>סיסמה ראשונית:</strong> ${user.id}</p>
      <p>לחץ על הכפתור למטה כדי להיכנס לאתר ולהגדיר סיסמה חדשה:</p>
      <p style="text-align: center">
        <a
          href="${process.env.FRONTEND_URL}"
          style="
            display: inline-block;
            padding: 10px 15px;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            border-radius: 3px;
          ">
          כניסה לאתר
        </a>
      </p>
      <hr />
      <p>אם לחיצה על הכפתור לא עובדת, העתיקו את הלינק לדפדפן.</p>
      ${process.env.FRONTEND_URL}
    </div>
  </body>
</html>
  `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error("Error sending welcome email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        return res.json({ message: "Welcome email sent" });
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
