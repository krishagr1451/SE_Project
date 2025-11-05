'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      id: 'rides',
      icon: '🚕',
      title: 'Rides & Booking',
      faqs: [
        { q: 'How do I book a ride?', a: 'Click on "Book Ride" from the navbar, enter your pickup and drop locations, and confirm your booking.' },
        { q: 'Can I cancel my ride?', a: 'Yes, you can cancel rides from the "My Rides" page. Cancellation charges may apply.' },
        { q: 'How is the fare calculated?', a: 'Fare is calculated based on distance (₹50 base fare + ₹15 per km) plus any applicable taxes and tolls.' },
        { q: 'What are the ride types?', a: 'We offer Auto, Mini, Sedan, and SUV options for different group sizes and budgets.' },
        { q: 'How long does it take to find a driver?', a: 'Usually within 2-5 minutes. Peak hours may take slightly longer.' }
      ]
    },
    {
      id: 'payment',
      icon: '💰',
      title: 'Payment & Wallet',
      faqs: [
        { q: 'What payment methods are accepted?', a: 'We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Drive Hire Wallet.' },
        { q: 'How do I add money to wallet?', a: 'Go to Wallet page, click "Add Money", enter amount and choose from UPI, Cards, or Net Banking.' },
        { q: 'Will I get a refund for cancelled rides?', a: 'Yes, refunds are processed within 5-7 business days to your original payment method or wallet.' },
        { q: 'Is GST included in fare?', a: 'Yes, all fares are inclusive of applicable GST as per Indian tax regulations.' }
      ]
    },
    {
      id: 'driver',
      icon: '🚗',
      title: 'Driver Support',
      faqs: [
        { q: 'How do I become a driver?', a: 'Register with valid Driving License, RC Book, Insurance papers, and Aadhaar/PAN for verification.' },
        { q: 'How do I receive payments?', a: 'Weekly payouts to your linked bank account via NEFT/IMPS. Track earnings in Driver Dashboard.' },
        { q: 'What documents are required?', a: 'Valid DL, Vehicle RC, Insurance, Pollution Certificate, and ID proof (Aadhaar/PAN).' },
        { q: 'What if passenger cancels?', a: 'You receive cancellation fee as per policy. Cancellation after pickup earns you minimum fare.' }
      ]
    },
    {
      id: 'safety',
      icon: '🛡️',
      title: 'Safety & Security',
      faqs: [
        { q: 'How is my data protected?', a: 'We comply with Indian IT Act 2000 and use 256-bit encryption. Data stored in India as per RBI guidelines.' },
        { q: 'What if I feel unsafe during ride?', a: 'Use in-app SOS button or call emergency helpline 1800-123-4567 (24x7 toll-free).' },
        { q: 'Are drivers verified?', a: 'Yes, all drivers undergo police verification, document checks, and background screening before approval.' },
        { q: 'Can I share my ride details?', a: 'Yes, share live ride tracking with emergency contacts via the "Share Trip" feature in app.' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">❓ Help & Support</h1>
          <p className="text-xl text-gray-600">How can we help you today?</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full px-6 py-4 pl-14 text-lg border-2 border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
            />
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          </div>
        </motion.div>

        {/* Category Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {categories.map((category, index) => (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center ${
                selectedCategory === category.id ? 'ring-4 ring-blue-500 transform scale-105' : ''
              }`}
            >
              <div className="text-5xl mb-3">{category.icon}</div>
              <h3 className="font-bold text-lg text-gray-900">{category.title}</h3>
            </motion.button>
          ))}
        </motion.div>

        {/* FAQs */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {categories.find(c => c.id === selectedCategory)?.icon}{' '}
              {categories.find(c => c.id === selectedCategory)?.title}
            </h2>
            <div className="space-y-4">
              {categories.find(c => c.id === selectedCategory)?.faqs.map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="font-semibold text-gray-900">{faq.q}</span>
                    <span className="text-2xl group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 text-gray-700 bg-blue-50 rounded-lg mt-2">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-3">📞</div>
            <h3 className="font-bold text-lg mb-2">Call Us</h3>
            <p className="mb-3">Available 24x7 (Toll-Free)</p>
            <a href="tel:18001234567" className="inline-block px-6 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              1800-123-4567
            </a>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-3">📧</div>
            <h3 className="font-bold text-lg mb-2">Email Support</h3>
            <p className="mb-3">Response within 24 hours</p>
            <a href="mailto:support@drivehire.com" className="inline-block px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              support@drivehire.com
            </a>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="font-bold text-lg mb-2">Live Chat</h3>
            <p className="mb-3">Chat with our support team</p>
            <button className="inline-block px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Chat
            </button>
          </div>
        </motion.div>

        {/* Emergency */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center"
        >
          <h3 className="text-2xl font-bold text-red-600 mb-2">🚨 Emergency?</h3>
          <p className="text-gray-700 mb-4">If you&apos;re in immediate danger, call emergency services or use our SOS feature</p>
          <div className="flex gap-4 justify-center">
            <a href="tel:100" className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
              📞 Call 100
            </a>
            <button className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">
              🆘 Trigger SOS
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
