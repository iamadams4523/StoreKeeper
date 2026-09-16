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

      // =====================================================
      // AUTHENTICATION FAILED
      // =====================================================

      if (!result || result.error) {
        setError(
          result?.error === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : result?.error || 'Unable to sign in.',
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // GET AUTHENTICATED SESSION
      // =====================================================

      /*
       * Authentication succeeded.
       *
       * Fetch the newly-created session so we can determine
       * the user's role and branch.
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
      const branchId = session?.user?.branchId ?? null;

      console.log('User role:', role);
      console.log('User status:', status);
      console.log('User branchId:', branchId);

      // =====================================================
      // MAKE SURE ROLE EXISTS
      // =====================================================

      if (!role) {
        setError(
          'Login succeeded, but your account role could not be determined.',
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // CHECK ACCOUNT STATUS
      // =====================================================

      /*
       * Suspended accounts should not be allowed into
       * the application.
       *
       * This is also enforced inside NextAuth authorize()
       * on the server. This is an additional client-side
       * safeguard.
       */
      if (status === 'SUSPENDED') {
        setError(
          'Your account has been suspended. Please contact an administrator.',
        );

        setLoading(false);
        return;
      }

      // =====================================================
      // ROLE-BASED REDIRECT
      // =====================================================

      /*
       * ADMIN
       *
       * Admin does NOT have a permanent branch.
       *
       * Admin goes to the Admin Dashboard first and can
       * then select a branch to operate.
       */
      if (role === 'ADMIN') {
        router.replace('/admin/dashboard');

        return;
      }

      /*
       * MANAGER
       *
       * Manager MUST have a branch assigned.
       *
       * Their branch comes from:
       *
       * session.user.branchId
       *
       * The Manager does not need to select a branch.
       */
      if (role === 'MANAGER') {
        if (!branchId) {
          setError(
            'Your manager account is not assigned to a branch. Please contact an administrator.',
          );

          setLoading(false);
          return;
        }

        router.replace('/manager');

        return;
      }

      /*
       * SALES ASSISTANT
       *
       * Sales Assistant MUST have a branch assigned.
       *
       * Their POS page will automatically use the
       * branch from their session.
       */
      if (role === 'SALES_ASSISTANT') {
        if (!branchId) {
          setError(
            'Your sales assistant account is not assigned to a branch. Please contact an administrator.',
          );

          setLoading(false);
          return;
        }

        router.replace('/pos');

        return;
      }

      // =====================================================
      // INVALID ROLE
      // =====================================================

      setError('Your account does not have a valid system role.');

      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);

      setError('An unexpected error occurred during login.');

      setLoading(false);
    }
  };

  // =========================================================
  // CREATE INITIAL ADMIN
  // =========================================================

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

  // =========================================================
  // UI
  // =========================================================

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
