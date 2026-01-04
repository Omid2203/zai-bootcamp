# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HR Profile Management System - a React + TypeScript web app for managing candidate profiles. Supports Google OAuth login via Supabase and stores data in Supabase Database.

## Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture

### Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS (via CDN in index.html)
- Supabase (Auth + Database)

### Key Files
- `App.tsx` - Main component with all view logic (LOGIN, LIST, PROFILE_DETAIL states)
- `types.ts` - Core type definitions (User, Profile, Comment, ViewState)

### Services
Located in `services/`:
- `supabase.ts` - Supabase client configuration
- `authService.ts` - Authentication (Google OAuth via Supabase)
- `profileService.ts` - CRUD operations for profiles
- `commentService.ts` - Comment management

### Components
Located in `components/`:
- `Header.tsx` - Top navigation with search and user info
- `ProfileCard.tsx` - Profile display in list view
- `CommentSection.tsx` - Comment display and input
- `AdminProfileEditor.tsx` - Admin modal for creating/editing profiles

### Database Tables (Supabase)
- `users` - User info with `is_admin` flag
- `profiles` - Candidate profiles (name, age, education, expertise, resume_link, interviewer_opinion, skills, bio, image_url)
- `comments` - Comments on profiles

### Environment Variables
Set in `.env.local`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

### Path Alias
`@` maps to project root (configured in vite.config.ts).

## Notes

- UI text is in Persian (Farsi)
- Admin users can create/edit/delete profiles (determined by `is_admin` field in users table)
- Regular users can view profiles and add comments
- All data persists in Supabase
