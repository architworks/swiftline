# High Velocity Reading Platform  
## Vision and Product Specification  
### Tech Stack: Next.js + Supabase

---

# 1. Vision

Build a personal high velocity reading platform that enables users to upload documents and consume them using Rapid Serial Visual Presentation (RSVP).

The goal is not just speed reading. The goal is structured, resumable, stateful reading with persistence, bookmarking, and cross session continuity.

This platform must:

- Allow document upload and storage
- Parse and normalize content into structured text
- Provide adjustable RSVP reading
- Persist reading progress
- Allow bookmarking and resume
- Support multi device login
- Operate entirely on free tier infrastructure

This is a personal scale product with low expected user volume.

---

# 2. Target User

Primary user: the builder  
Secondary users: small group of power readers

Users value:
- Speed
- Clean UX
- Progress tracking
- Persistent state
- Minimal distraction

---

# 3. Core Product Capabilities

## 3.1 Authentication

Users must be able to:

- Sign up with email and password
- Log in
- Log out
- Persist session
- Reset password

Authentication must use Supabase Auth.

No custom auth implementation.

---

## 3.2 Document Upload

Users must be able to upload:

- PDF
- DOCX
- Markdown
- EPUB

Platform must:

- Store original file in Supabase Storage
- Parse content on client side
- Normalize text into structured format
- Persist parsed version in database

Parsing should extract:
- Clean text
- Paragraph boundaries
- Heading structure if possible
- Word level tokenization

Parsing implementation details are up to the coding agent, but it must run client side.

---

## 3.3 Document Persistence

Each uploaded document must:

- Be tied to a specific user
- Store metadata such as title and total word count
- Store normalized word array
- Support efficient loading for RSVP playback

The system must avoid reparsing files on every load.

---

## 3.4 RSVP Reading Engine

The reader must:

- Display words in a fixed central position
- Support adjustable WPM
- Allow pause and resume
- Allow forward and backward jumps
- Show progress percentage
- Support auto resume from last position

User controls must include:

- Play and pause
- WPM slider
- Jump forward and backward
- Jump to arbitrary position using progress bar
- Bookmark current position

The reader must be visually stable with no layout shift.

---

## 3.5 Reading Progress Tracking

The system must:

- Track current word index
- Calculate percent completion
- Persist progress periodically
- Resume from last saved position

Progress updates must not trigger excessive database writes.

Progress must sync across devices.

Server state is the source of truth.

---

## 3.6 Bookmarking

Users must be able to:

- Create bookmark at current word index
- Add optional note
- View list of bookmarks per document
- Jump to bookmark
- Delete bookmark

Bookmarks are private to the user.

---

## 3.7 Library View

Users must have:

- A document library dashboard
- List of uploaded documents
- Display of percent complete
- Last opened timestamp
- Option to delete document
- Option to resume reading

---

# 4. Non Functional Requirements

- Must run on free tier Supabase
- Must use Next.js frontend
- Must use Supabase for:
  - Auth
  - Postgres database
  - Storage
- Must enable Row Level Security
- Must ensure documents are private
- Must support low to moderate document sizes
- Must avoid unnecessary background services

No external paid services.

---

# 5. Platform Architecture

## Frontend

- Next.js App Router
- Client side parsing
- React based RSVP reader component
- API communication through Supabase client

## Backend

Supabase services only:

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Row Level Security policies

No custom backend server required.

---

# 6. Data Model Intent

The system requires the following logical entities:

Users  
Documents  
Document Contents  
Reading Progress  
Bookmarks  

Relationships:

- One user owns many documents
- One document has one parsed content record
- One user has one progress record per document
- One document can have many bookmarks per user

All records must be scoped to authenticated user via RLS.

---

# 7. Security Constraints

- All document data must be private
- Storage buckets must not be public
- Access must be restricted to owner
- RLS policies must enforce user ownership
- No document data should be accessible across users

---

# 8. UX Principles

- Minimal interface
- Center anchored reading zone
- No visual jitter
- Dark and light mode support
- Keyboard shortcuts supported
- Smooth WPM transitions

The experience must feel fast and distraction free.

---

# 9. Out of Scope For MVP

The following are explicitly excluded from initial build:

- AI summarization
- Adaptive reading speed
- Reading analytics dashboards
- Social features
- Public document sharing
- Real time collaboration
- Folder hierarchies
- Heavy telemetry

The objective is stable and clean RSVP reading with persistence.

---

# 10. Success Criteria

The system is successful when:

- User can upload document
- User can read using RSVP
- User can adjust speed
- User can bookmark
- User can close browser and resume later
- User can switch devices and continue reading
- Data remains private

---

# 11. Development Priorities

1. Authentication
2. Database schema
3. File upload and parsing
4. Document persistence
5. RSVP engine
6. Progress tracking
7. Bookmarking
8. Library UI
9. Security hardening

Build core reading before polishing UI.

---

# 12. Guiding Philosophy

This is a personal scale productivity tool.

Optimize for:

- Clean architecture
- Simplicity
- Maintainability
- Low infrastructure cost
- Reliability over feature depth

Avoid overengineering.

Ship a stable reading system first.