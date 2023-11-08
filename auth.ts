import NextAuth from "next-auth";
import {authConfig} from "@/auth.config";
import Credentials from 'next-auth/providers/credentials'
import {z} from 'zod'
import type {User} from '@/app/lib/definitions'
import bcrypt from 'bcrypt'
import {sql} from '@vercel/postgres'

const getUser = async (email: string): Promise<User|undefined> => {
    try{
        const user = await sql<User>`SELECT * FROM users WHERE email=${email}`
        return user.rows[0];
    } catch(err) {
        console.error('Error to fetch User', err)
        throw new Error('Failed to fetch User')
    }
}

export const {auth, signIn, signOut} = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredential = z.object({
                    email: z.string().email(), password: z.string().min(6)
                }).safeParse(credentials)
                if (!parsedCredential.success) {
                    return null
                }
                const {email, password} = parsedCredential.data
                const user = await getUser(email)
                if (!user) {
                    return null
                }
                const passwordMatch = await bcrypt.compare(password, user.password)
                if (passwordMatch) {
                    return user
                }
                console.log('Invalid credentials')
                return null
            }
        })
    ]
})