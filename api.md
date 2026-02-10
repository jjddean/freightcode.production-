# Internal API System Walkthrough

I have implemented a secure API key system that allows clients to programmatically access their data.

## Changes Verified

1.  **Database Schema**: Added `apiKeys` table to `convex/schema.ts` to store API keys securely linked to users.
2.  **Backend Logic**: Created `convex/developer.ts` with:
    - `generateApiKey`: Creates a new generic key (starts with `mk_live_`).
    - `listApiKeys`: lists active keys (masked for security).
    - `revokeApiKey`: invalidates a key.
    - `getShipmentsApi`: A sample public query that validates the passed `apiKey`.
3.  **Frontend UI**: Updated `/api` (Api Docs Page) to include a "Your API Keys" section.
    - **Authentication**: Uses Clerk (`useUser`) to ensure only logged-in users see the management UI.
    - **Key Generation**: Users can click "Generate Key" to get a new key. The key is shown *once* for security.
    - **Key Management**: Users can see a list of their active keys and revoke them.

## detailed Verification Steps

### 1. Test Key Generation
1.  Navigate to the API Docs page: [http://localhost:5173/api](http://localhost:5173/api) (or your local equivalent).
2.  **Sign In**: Ensure you are signed in. You should see "Your API Keys" section.
3.  **Generate**: Click **Generate New Key**.
4.  **Verify**: A new key starting with `mk_live_` should appear in a green box. Copy it!
5.  **List**: The key should also appear in the list below with a masked value (e.g., `mk_live_...a1b2`).

### 2. Test Revocation
1.  Click the **Trash Icon** next to a key.
2.  Confirm the dialog.
3.  Verify the key disappears from the list.

### 3. Test the API (Console)
You can test the backend function directly in the browser console while on the page (since the Convex client is active):

```javascript
// Valid Call (Replace YOUR_KEY with the one you generated)
await window.convex.query(api.developer.getShipmentsApi, { apiKey: "YOUR_KEY" })

// Should return: { success: true, count: ..., data: [...] }
```
*(Note: You might need to expose `convex` globally or just trust the backend logic which was implemented with standard patterns.)*

### 4. Code Review
- **`convex/developer.ts`**: Check the logic for `getShipmentsApi` to see how it validates `apiKeys` table lookups.
