-- =====================================================
-- FIX RLS POLICIES FOR DECKS, FLASHCARDS, DECK_CARDS
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================

-- First, let's check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('decks', 'flashcards', 'deck_cards');

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('decks', 'flashcards', 'deck_cards');
