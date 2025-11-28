# Authentication Error Handling Fix

## Issue
When trying to create a new deck while not logged in, the app showed a red runtime error instead of gracefully redirecting to the login page.

## Root Cause
The `createDeck()` function in `/lib/database.ts` throws an error when the user is not authenticated:
```typescript
if (!user) {
  throw new Error('User must be logged in to create decks')
}
```

This error was not being caught properly in all places where `createDeck()` is called.

## Solution
Added try-catch error handling in three locations:

### 1. Home Page (`/app/page.tsx`)
- **handleSaveNewDeck()** - When creating a deck from the deck selection dropdown
- **handleConfirmAddToDeck()** - When creating a deck while saving an AI-generated card

### 2. Deck View (`/app/deck/[deckId]/page.tsx`)
- **handleConfirmAddToDeck()** - When creating a deck while adding a card from deck view

## Behavior
When an authentication error is detected:
1. Shows a user-friendly alert: "Please sign in to create decks"
2. Automatically redirects to `/login` page
3. No more red runtime error screen

## Code Pattern
```typescript
try {
  const newDeck = await createDeck(newDeckName)
  // ... success handling
} catch (error) {
  console.error('Error creating deck:', error)
  // Check if it's an auth error
  if (error instanceof Error && error.message.includes('logged in')) {
    alert("Please sign in to create decks")
    router.push("/login")
  } else {
    alert("Failed to create deck. Please try again.")
  }
}
```

## Testing
To test this fix:
1. Make sure you're logged out
2. Try to create an AI flashcard with the camera
3. When prompted to add to a deck, create a new deck
4. Should see a clean alert and redirect to login, not a red error screen
