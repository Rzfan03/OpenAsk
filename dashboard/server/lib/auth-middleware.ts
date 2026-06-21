import { Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'
import prisma from '../prisma/client'

export async function createToken(): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await prisma.session.create({ data: { token } })
  return token
}

export async function removeToken(token: string) {
  await prisma.session.deleteMany({ where: { token } })
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = header.slice(7)
  prisma.session.findUnique({ where: { token } })
    .then(session => {
      if (!session) return res.status(401).json({ error: 'Unauthorized' })
      next()
    })
    .catch(next)
}
