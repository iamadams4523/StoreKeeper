// 'use client';

// import { useState } from 'react';
// import { signIn, getSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation';
// import { createInitialAdmin } from '@/app/actions/seed';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [successMsg, setSuccessMsg] = useState('');
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const result = await signIn('credentials', {
//         email,
//         password,
//         redirect: false,
//       });

//       if (result?.error) {
//         setError(result.error);
//         setLoading(false);
//         return; // Stop execution here on error
//       }

//       // Force a completely fresh fetch of the session, bypassing all caches
//       const res = await fetch('/api/auth/session', {
//         cache: 'no-store', // Tells Next.js not to cache
//         headers: {
//           'Cache-Control': 'no-cache, no-store, must-revalidate',
//           Pragma: 'no-cache',
//         },
//       });

//       const session = await res.json();

//       // DEBUG: This will pop up on your screen so you can see EXACTLY what NextAuth is doing
//       console.log('Session Data:', session);
//       // alert(`Debug -> Role from database is: ${session?.user?.role}`);

//       // Safely check the role and route
//       if (session?.user?.role?.toUpperCase() === 'ADMIN') {
//         router.push('/admin/dashboard');
//       } else {
//         router.push('/pos');
//       }

//       router.refresh();
//     } catch (err) {
//       setError('An unexpected error occurred during login.');
//       setLoading(false);
//     }
//   };
//   const handleSeedAdmin = async () => {
//     const res = await createInitialAdmin();
//     if (res.success) {
//       setSuccessMsg(
//         `Default Admin created! Email: ${res.email} | Password: admin123`,
//       );
//       setEmail(res.email || 'admin@store.com');
//       setPassword('admin123');
//     } else {
//       setError(res.message || 'Admin already exists.');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//       <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
//         <div className="text-center mb-8">
//           <h1 className="text-2xl font-bold text-gray-900">Store Portal</h1>
//           <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
//         </div>

//         {successMsg && (
//           <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
//             {successMsg}
//           </div>
//         )}

//         {error && (
//           <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleLogin} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Email Address
//             </label>
//             <input
//               type="email"
//               required
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
//               placeholder="admin@store.com"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Password
//             </label>
//             <input
//               type="password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
//               placeholder="••••••••"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
//           >
//             {loading ? 'Signing in...' : 'Sign In'}
//           </button>
//         </form>

//         <div className="mt-6 pt-6 border-t border-gray-100 text-center">
//           <p className="text-xs text-gray-500 mb-2">
//             Setting up for the first time?
//           </p>
//           <button
//             onClick={handleSeedAdmin}
//             type="button"
//             className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
//           >
//             Click here to create default Admin account
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createInitialAdmin } from '@/app/actions/seed';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      console.log('Login result:', result);

      // Authentication failed
      if (!result || result.error) {
        setError(
          result?.error === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : result?.error || 'Unable to sign in.',
        );

        setLoading(false);
        return;
      }

      /*
       * Authentication succeeded.
       *
       * Fetch the newly-created session so we can determine
       * whether the user is an ADMIN or SALES_ASSISTANT.
       */
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Unable to retrieve user session.');
      }

      const session = await response.json();

      console.log('Authenticated session:', session);

      const role = session?.user?.role;
      const status = session?.user?.status;

      /*
       * Make sure the session actually contains the role.
       */
      if (!role) {
        setError(
          'Login succeeded, but your account role could not be determined.',
        );
        setLoading(false);
        return;
      }

      /*
       * Prevent suspended accounts from accessing the application.
       *
       * This should ALSO be enforced inside the NextAuth authorize()
       * function on the server. This check is only an additional
       * client-side safeguard.
       */
      if (status === 'SUSPENDED') {
        setError(
          'Your account has been suspended. Please contact an administrator.',
        );
        setLoading(false);
        return;
      }

      /*
       * Route users according to their database role.
       */
      if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else if (role === 'SALES_ASSISTANT') {
        router.replace('/pos');
      } else {
        setError('Your account does not have a valid system role.');
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (error) {
      console.error('Login error:', error);

      setError('An unexpected error occurred during login.');
      setLoading(false);
    }
  };

  const handleSeedAdmin = async () => {
    setError('');
    setSuccessMsg('');

    try {
      const res = await createInitialAdmin();

      if (res.success) {
        const adminEmail = res.email || 'admin@store.com';

        setSuccessMsg(
          `Default Admin created! Email: ${adminEmail} | Password: admin123`,
        );

        setEmail(adminEmail);
        setPassword('admin123');
      } else {
        setError(res.message || 'Admin already exists.');
      }
    } catch (error) {
      console.error('Seed admin error:', error);
      setError('Failed to create the default admin account.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Store Portal</h1>

            <p className="text-gray-500 text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
              {successMsg}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                placeholder="admin@store.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-black"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Seed admin */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Setting up for the first time?
            </p>

            <button
              onClick={handleSeedAdmin}
              type="button"
              disabled={loading}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer disabled:opacity-50"
            >
              Click here to create default Admin account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
