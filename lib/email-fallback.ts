// Fallback email service for development/testing
export async function sendPasswordResetEmailFallback(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`

  console.log("=== PASSWORD RESET EMAIL ===")
  console.log(`To: ${email}`)
  console.log(`Reset URL: ${resetUrl}`)
  console.log(`Login URL: ${loginUrl}`)
  console.log("============================")

  // In development, you can copy this URL and use it directly
  return Promise.resolve()
}

export async function sendWelcomeEmailFallback(email: string, name: string, role: string, organizationName: string) {
  console.log("=== WELCOME EMAIL ===")
  console.log(`To: ${email}`)
  console.log(`Name: ${name}`)
  console.log(`Role: ${role}`)
  console.log(`Organization: ${organizationName}`)
  console.log("=====================")

  return Promise.resolve()
}

export async function sendAccountSetupEmailFallback(
  email: string,
  name: string,
  role: string,
  organizationName: string,
  resetToken: string,
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`

  console.log("=== ACCOUNT SETUP EMAIL ===")
  console.log(`To: ${email}`)
  console.log(`Name: ${name}`)
  console.log(`Role: ${role}`)
  console.log(`Organization: ${organizationName}`)
  console.log(`Reset URL: ${resetUrl}`)
  console.log(`Login URL: ${loginUrl}`)
  console.log("===========================")

  return Promise.resolve()
}

export async function sendEmailUpdateNotificationFallback(
  email: string,
  resetToken: string,
) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

  console.log("=== EMAIL UPDATE NOTIFICATION ===")
  console.log(`To: ${email}`)
  console.log(`Reset URL: ${resetUrl}`)
  console.log("=================================")

  return Promise.resolve()
}
