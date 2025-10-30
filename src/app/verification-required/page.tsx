'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function VerificationRequiredPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-5xl">⏳</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-gray-800 mb-4"
        >
          Verification Required
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          {user?.role === 'DRIVER' ? (
            <>
              Your driver account is pending verification. Our team will review your license information and verify your account within 24-48 hours.
            </>
          ) : (
            <>
              Please verify your email address to access this feature. Check your inbox for a verification link.
            </>
          )}
        </motion.p>

        {user?.role === 'DRIVER' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-indigo-50 rounded-lg p-4 mb-6 text-left"
          >
            <h3 className="font-semibold text-indigo-900 mb-2">What's being verified?</h3>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>✓ Driver's license validity</li>
              <li>✓ Identity confirmation</li>
              <li>✓ Background check</li>
            </ul>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-blue-800">
              Didn't receive the email?{' '}
              <button className="underline font-semibold hover:text-blue-600">
                Resend verification link
              </button>
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Link
            href="/"
            className="block w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/help"
            className="block w-full py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Contact Support
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-gray-500 mt-6"
        >
          You'll receive an email notification once verification is complete
        </motion.p>
      </motion.div>
    </div>
  )
}
