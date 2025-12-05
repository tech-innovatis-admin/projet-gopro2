import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function authenticateUser(identifier: string, password: string) {
  const user = await prisma.users.findFirst({
    where: {
      AND: [
        {
          OR: [
            { email: identifier },
            { username: identifier },
          ],
        },
        { platforms: { has: 'projetos' } },
      ],
    },
  })

  if (!user) {
    return null
  }

  const isValidPassword = await verifyPassword(password, user.hash)
  if (!isValidPassword) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
}