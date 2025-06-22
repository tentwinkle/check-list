import nodemailer from "nodemailer";
import { sendPasswordResetEmailFallback, sendWelcomeEmailFallback, sendAccountSetupEmailFallback } from "./email-fallback";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
})

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // Use fallback in development if SMTP is not configured
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    return sendPasswordResetEmailFallback(email, resetToken)
  }

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Reset Your Password - Inspection System",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Password Reset Request</h2>
        <p>You have been added to the Inspection System. Please click the link below to set your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Set Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${email}`)
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw new Error("Failed to send password reset email")
  }
}

export async function sendWelcomeEmail(email: string, name: string, role: string, organizationName: string) {
  // Use fallback in development if SMTP is not configured
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    return sendWelcomeEmailFallback(email, name, role, organizationName)
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to Inspection System",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Welcome to the Inspection System</h2>
        <p>Hello ${name},</p>
        <p>You have been added to the Inspection System for <strong>${organizationName}</strong> with the role of <strong>${role}</strong>.</p>
        <p>You should receive a separate email with instructions to set your password.</p>
        <p>If you have any questions, please contact your administrator.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${email}`)
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw new Error("Failed to send welcome email")
  }
}

export async function sendAccountSetupEmail(
  email: string,
  name: string,
  role: string,
  organizationName: string,
  resetToken: string,
) {
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    return sendAccountSetupEmailFallback(email, name, role, organizationName, resetToken)
  }

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Welcome to Inspection System",
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>Welcome to the Inspection System</h2>
        <p>Hello ${name},</p>
        <p>You have been added to <strong>${organizationName}</strong> with the role of <strong>${role}</strong>.</p>
        <p>Please click the link below to set your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Set Password</a>
        <p>After setting your password you can log in here:</p>
        <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px;">Login</a>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Account setup email sent to ${email}`)
  } catch (error) {
    console.error("Error sending account setup email:", error)
    throw new Error("Failed to send account setup email")
  }
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    await transporter.verify()
    console.log("Email configuration is valid")
    return true
  } catch (error) {
    console.error("Email configuration error:", error)
    return false
  }
}
