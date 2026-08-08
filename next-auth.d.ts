// import 'next-auth';
// import { DefaultSession } from 'next-auth';

// declare module 'next-auth' {
//   interface User {
//     id: string;
//     role: string;
//   }

//   interface Session {
//     user: {
//       id: string;
//       role: string;
//     } & DefaultSession['user'];
//   }
// }

// declare module 'next-auth/jwt' {
//   interface JWT {
//     id: string;
//     role: string;
//   }
// }

import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    role: string;
    status: string;
    name?: string | null;
    email?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    status: string;
    name?: string | null;
    email?: string | null;
  }
}
