# Discussion rooms and private chat

## Setup

If discussion rooms, private chat and unread badges already work, run only `backend/db/migrations/006_chat_attachments_and_delete.sql` once against your existing database. It adds attachment fields, a deletion flag and a per-user hidden-message table. Your existing messages remain available as text messages.

For an older database missing the chat features, apply the unapplied migrations 003 through 007 in numeric order. For a new database, `backend/db/schema.sql` includes everything. Do not run the full schema against an existing database because its original sections drop tables. Keep any schema adjustments you previously made for your database.

Start the backend and frontend using their existing setup and `npm run dev` commands. No new environment variables are required.

Run `npm ci` in the backend and frontend after all eight packages have merged.

## How to use

- Sign in and select Discussion Rooms in the sidebar. Create a room with a name and optional description, then send messages. Every signed-in member can read and post in every room.
- Select Private Chat, choose a member, and open a conversation. Starting another chat with the same member opens the existing conversation.
- Use Delete on a message to choose Delete for me, which hides it only from your view. For your own messages, Delete for everyone also appears. That option replaces the message with a deleted-message notice for everyone and removes its stored attachment.
- Choose Image or File to attach a file up to 25 MB. Add an optional caption and send. Shared images appear in the message; selecting an image opens it full size. File cards download on click.
- Choose Voice, allow microphone access, record, and select Stop. Play the preview, then send it or remove it. Cancel recording discards it. Recording requires HTTPS or localhost and a browser that supports MediaRecorder; microphone permission must be granted.
- Use Edit on your own messages to change text or an attachment caption.
- Messages refresh every three seconds. Room and conversation lists and sidebar badges refresh every five seconds while the browser tab is visible.
- Blue badges show unread messages from other members beside each room or conversation and in the sidebar. Opening a thread marks the displayed messages as read. Read status is saved in the database per user and stays saved after signing out. Older messages count as unread until you open their thread once.
- Room and conversation lists have search, message previews, and neutral text colors. Messages have date separators and timestamps. Use Enter to send or Shift + Enter to add a new line.
- Deleting a message, question, answer, or PDF opens a styled confirmation dialog. Keep it, the close button, or Escape cancels the action. The dialog traps keyboard focus and initially focuses Keep it.

## Code guide

Both features follow the existing route, validation, controller, service, and SQL pattern. `discussion` and `chat` folders contain the backend files and frontend API services. `DiscussionRooms.jsx` and `PrivateChat.jsx` handle selecting rooms or conversations. The shared `MessageThread.jsx` handles messages and the composer. `MessageAttachment.jsx` displays attachments, and `VoiceRecorder.jsx` handles the browser microphone.

`MessageContext.jsx` supplies the shared unread counts and refreshes both lists. `ConfirmContext.jsx` supplies the shared confirmation dialog. These use existing React and browser features and require no new packages.

The backend uses the forum's existing token authentication and error handler. Private chat checks conversation membership before reading messages, uploading files or downloading attachments. The server checks message ownership before editing or deleting for everyone. Delete for me changes only the requesting user's view. Hidden and deleted messages are excluded from unread counts.

Attachment bytes are stored in `backend/uploads/chat`, which is created automatically. Downloads go through authenticated API routes. Keep this folder when moving or backing up the application; include it alongside the database backup. `chat.upload.js` uses the existing Multer package and Node file helpers, with a 25 MB upload limit.

The implementation uses text messages, common images, voice recordings and downloadable files. Styling uses the existing design tokens, including orange action buttons, dark mode and mobile layouts.


## Room management and sign-in update

- Open a room you created to see Rename and Delete room in its header.
- Rename uses a small form; delete uses the existing styled confirmation dialog.
- Deleting a room removes its messages, attachments, and unread tracking. Only the creator can manage a room; this is enforced by the server.
- Password and Google sign-in now start on the dashboard. Logout clears the previous navigation destination.
- No additional database migration is required. Restart the backend after replacing the project files.


## Forum polish update

- Rejected PDFs and failed parsing, chunking, or embedding uploads are removed from uploads/rag. Incomplete document records are deleted; their chunks and vectors are removed by the existing cascading foreign keys. The per-user limit defaults to 20 PDFs.
- PDF uploads are limited to 10 MB in the browser and backend.
- Room creators can rename or delete rooms directly below the room entry in the sidebar list.
- Members with an existing private conversation are hidden from Start a new chat.
- The discussion feed shows 10 questions initially. A visibleCount state controls questions.slice(0, visibleCount); Load more adds 10, and changing search resets the count. This uses the existing fetched result set (the normal feed currently retrieves up to 100 questions); it does not add database pagination.
- Visitors see the landing page. Logged-in users opening / go to the dashboard, where the existing sidebar Logout button remains available.
- The desktop sidebar divider aligns with the navbar at 4.25rem.
- No database migration is needed. Replace the frontend and backend files, then restart the backend.


## Avatar files and room cards

Avatars are stored in backend/uploads/avatars and the database stores a short /uploads/avatars/... path. The frontend resolves this against VITE_API_BASE_URL. New photo selection uses the existing upload form; the backend writes the image to disk before returning a path. Existing Base64 avatars are automatically converted when the backend starts. Keep uploads/avatars when updating or deploying the project. No SQL migration is required. Restart the backend and sign in again to refresh stored profile data.

Room Rename and Delete controls appear directly below the room name inside the same bordered room card.


## Backend pagination and Markdown toolbar

The dashboard requests /api/questions?limit=10&offset=0. Load more requests offset=10, then 20, and appends the returned questions. The backend validates the pagination inputs, uses LIMIT and OFFSET, and returns total and hasMore metadata. Normal and keyword feeds order by created_at DESC, question_id DESC. No 100-question feed cap remains when paging. Search changes restart at offset zero; outdated responses are ignored. Dashboard statistics describe loaded questions. Other callers retain the previous default page size of 100 unless they supply a limit.

AI search also returns pages with total and hasMore, ranked by similarity; the existing algorithm still calculates similarity across stored embeddings on the backend.

The Markdown toolbar keeps the textarea selection when clicked, trims whitespace outside Bold/Italic markers, supports removing those markers on a second click, and applies H1 (#) to the current line or selected lines. Preview displays the formatted result.
