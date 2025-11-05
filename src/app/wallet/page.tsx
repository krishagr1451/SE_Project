'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Transaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
  date: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
}

export default function WalletPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [loading, setLoading] = useState(true)

  // Protect route: require authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    } else if (user) {
      fetchWalletData()
    }
  }, [authLoading, user, router])

  async function fetchWalletData() {
    try {
      const auth = localStorage.getItem('auth')
      if (!auth) return

      const { token } = JSON.parse(auth)

      // Fetch wallet balance
      const walletResponse = await fetch('http://localhost:4000/api/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const walletData = await walletResponse.json()
      setBalance(walletData.wallet?.balance || 0)

      // Fetch transactions
      const transactionsResponse = await fetch('http://localhost:4000/api/wallet/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const transactionsData = await transactionsResponse.json()
      
      // Transform transactions to match interface
      const transformedTransactions = (transactionsData.transactions || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || 'Transaction',
        date: t.createdAt,
        status: t.status.toUpperCase() as 'COMPLETED' | 'PENDING' | 'FAILED'
      }))
      
      setTransactions(transformedTransactions)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMoney() {
    const addAmount = parseFloat(amount)
    if (addAmount > 0) {
      try {
        const auth = localStorage.getItem('auth')
        if (!auth) return

        const { token } = JSON.parse(auth)

        const response = await fetch('http://localhost:4000/api/wallet/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount: addAmount }),
        })

        if (response.ok) {
          await fetchWalletData() // Refresh wallet data
          setAmount('')
          setShowAddMoney(false)
          alert(`₹${addAmount} added successfully!`)
        } else {
          alert('Failed to add money. Please try again.')
        }
      } catch (error) {
        console.error('Error adding money:', error)
        alert('Failed to add money. Please try again.')
      }
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          <p className="mt-4 text-gray-600">{authLoading ? 'Loading...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Wallet</h1>
          <p className="text-gray-600">Manage your payments and transactions</p>
        </motion.div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white mb-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-green-100 mb-2">Available Balance</p>
              <h2 className="text-5xl font-bold">₹{balance.toLocaleString()}</h2>
            </div>
            <div className="text-6xl"> </div>
          </div>
          <button
            onClick={() => setShowAddMoney(!showAddMoney)}
            className="w-full bg-white text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Add Money
          </button>
        </motion.div>

        {/* Add Money Modal */}
        {showAddMoney && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-white rounded-xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Money to Wallet</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAmount('500')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  ₹500
                </button>
                <button
                  onClick={() => setAmount('1000')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  ₹1000
                </button>
                <button
                  onClick={() => setAmount('2000')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  ₹2000
                </button>
                <button
                  onClick={() => setAmount('5000')}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  ₹5000
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddMoney}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Add Money
                </button>
                <button
                  onClick={() => setShowAddMoney(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2"> </div>
            <p className="text-sm font-medium text-gray-700">UPI</p>
          </button>
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2"> </div>
            <p className="text-sm font-medium text-gray-700">Bank</p>
          </button>
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2"> </div>
            <p className="text-sm font-medium text-gray-700">Cash</p>
          </button>
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center">
            <div className="text-3xl mb-2"> </div>
            <p className="text-sm font-medium text-gray-700">Offers</p>
          </button>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2"> </div>
              <p className="text-gray-600">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      transaction.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'CREDIT' ? 'IN' : 'OUT'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      transaction.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
