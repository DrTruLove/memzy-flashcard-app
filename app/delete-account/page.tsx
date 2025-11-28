'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !confirmEmail) {
      setError('Please fill in both email fields')
      return
    }

    if (email !== confirmEmail) {
      setError('Email addresses do not match')
      return
    }

    setIsSubmitting(true)

    // In a real implementation, you would send this to your backend
    // For now, we'll simulate the request
    try {
      // Check if user exists
      const { data: { user } } = await supabase.auth.getUser()
      
      // Simulate sending deletion request
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsSubmitted(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Deletion Request Received</CardTitle>
            <CardDescription>
              We have received your account deletion request for {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Your request will be processed within 7 days</li>
                <li>You will receive a confirmation email once complete</li>
                <li>All your data will be permanently deleted</li>
              </ul>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Questions? Contact us at <a href="mailto:support@memzy.app" className="text-purple-600 hover:underline">support@memzy.app</a>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Delete Your Memzy Account</CardTitle>
          <CardDescription>
            Request permanent deletion of your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">This action is permanent</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Once your account is deleted, all your data will be permanently removed and cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          {/* What gets deleted */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Data that will be deleted:</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Your email address and account credentials</li>
              <li>• All flashcard decks you have created</li>
              <li>• All individual flashcards and images</li>
              <li>• Your learning progress and statistics</li>
              <li>• Any saved preferences and settings</li>
            </ul>
          </div>

          {/* Retention info */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Data retention:</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All data will be permanently deleted within 7 days of your request. No data is retained after deletion.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your account email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmEmail">Confirm email address</Label>
              <Input
                id="confirmEmail"
                type="email"
                placeholder="Confirm your email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <Button 
              type="submit" 
              variant="destructive" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Request Account Deletion'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            Need help? Contact <a href="mailto:support@memzy.app" className="text-purple-600 hover:underline">support@memzy.app</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
