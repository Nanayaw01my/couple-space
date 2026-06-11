import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from './mongodb';
import User from './models/User';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) return null;
        const valid = await user.comparePassword(credentials.password);
        if (!valid) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          coupleId: user.coupleId?.toString() ?? null,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.coupleId = (user as any).coupleId;
        token.role = (user as any).role;
      }
      // Re-fetch coupleId from DB whenever session is updated or coupleId is missing.
      // This handles the case where the user sets up a couple after logging in.
      if (token.id && (!token.coupleId || trigger === 'update')) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select('coupleId role');
          if (dbUser?.coupleId) token.coupleId = dbUser.coupleId.toString();
        } catch { /* best-effort */ }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).coupleId = token.coupleId;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'couple-space-secret-change-in-prod',
};
