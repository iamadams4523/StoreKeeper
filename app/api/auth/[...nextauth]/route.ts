// import NextAuth, { NextAuthOptions } from 'next-auth';
// import CredentialsProvider from 'next-auth/providers/credentials';
// import bcrypt from 'bcrypt';
// import prisma from '@/lib/prisma';

// export const authOptions: NextAuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: 'Credentials',
//       credentials: {
//         email: {
//           label: 'Email',
//           type: 'email',
//           placeholder: 'admin@store.com',
//         },
//         password: { label: 'Password', type: 'password' },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error('Missing email or password');
//         }

//         // 1. Find the user in our database
//         const user = await prisma.user.findUnique({
//           where: { email: credentials.email },
//         });

//         if (!user || !user.password) {
//           throw new Error('Invalid credentials');
//         }

//         // 2. Verify the hashed password
//         const isPasswordValid = await bcrypt.compare(
//           credentials.password,
//           user.password,
//         );

//         if (!isPasswordValid) {
//           throw new Error('Invalid credentials');
//         }

//         // 3. Block suspended staff members
//         if (user.status === 'SUSPENDED') {
//           throw new Error('Account suspended');
//         }

//         // 4. Return the secure profile
//         return {
//           id: user.id,
//           email: user.email,
//           name: `${user.firstName} ${user.lastName}`,
//           role: user.role,
//         };
//       },
//     }),
//   ],
//   callbacks: {
//     // Inject the user role into the secure JWT token
//     async jwt({ token, user }) {
//       if (user) {
//         token.role = user.role;
//         token.id = user.id;
//       }
//       return token;
//     },
//     // Pass the token data into the browser session
//     async session({ session, token }) {
//       if (token && session.user) {
//         session.user.role = token.role as string;
//         session.user.id = token.id as string;
//       }
//       return session;
//     },
//   },
//   session: { strategy: 'jwt' },
//   pages: { signIn: '/login' },
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'admin@store.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password');
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase().trim(),
          },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordValid) {
          throw new Error('Invalid credentials');
        }

        // Prevent suspended accounts from logging in
        if (user.status === 'SUSPENDED') {
          throw new Error(
            'Your account has been suspended. Please contact an administrator.',
          );
        }

        /*
         * Everything returned here becomes available
         * to the JWT callback as `user`.
         */
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],

  callbacks: {
    /*
     * Runs when the JWT is created/updated.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },

    /*
     * Makes the JWT information available
     * through useSession()/getSession().
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;

        if (token.email) {
          session.user.email = token.email;
        }

        if (token.name) {
          session.user.name = token.name;
        }
      }

      return session;
    },
  },

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
