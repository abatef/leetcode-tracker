# LeetcodeTracker

Try the live demo of the app here:
https://leetcode-tracker-bf05c.web.app

## Getting Started

To get started, add your Firebase credentials to the following files:
- For development, update [`environment.ts`](./src/app/environments/environment.ts).
- For production, update [`environment.prod.ts`](./src/app/environments/environment.prod.ts).

**Note:** Direct API requests may encounter CORS issues. To resolve this, set up a proxy using Cloudflare Workers:
1. Copy the code from [`worker.js`](./src/app/environments/worker.js).
2. Deploy it as a Cloudflare Worker.
3. Update your API calls to use your Worker’s URL.

Example environment configuration:
```typescript
export const environment = {
    production: true,
    apiUrl: 'https://{worker-name}.{your-username}.workers.dev/api/leetcode/graphql',
    geminiApiKey: 'your-gemini-api-key',
    firebase: {
        apiKey: 'your-firebase-api-key',
        authDomain: 'your-firebase-auth-domain',
        projectId: 'your-firebase-project-id',
        storageBucket: 'your-firebase-storage-bucket',
        messagingSenderId: 'your-firebase-messaging-sender-id',
        appId: 'your-firebase-app-id'
    }
};

export default environment;
```

## Firestore Security Rules

Set up Firestore rules in the Firebase console to secure your data:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /problems/{problemId} {
      allow read, write: if request.auth != null;
    }
    match /userProblems/{userId}/problems/{problemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
If your app needs additional indexes, Firebase will prompt you with a link in the browser console. Follow it to create the required indexes.

## Authentication Setup

Enable both "Login with Google" and "Anonymous login" in the Firebase Authentication settings.

## Installing Dependencies

Install all necessary npm packages by running:
```bash
npm install
```

## Setting Up the Proxy with Cloudflare Workers (Web UI)

You can easily set up the proxy using the Cloudflare Workers web interface:
1. Visit the [Cloudflare Dashboard](https://dash.cloudflare.com/) and go to **Workers & Pages**.
2. Click **Create a Worker**.
3. Paste the code from [`worker.js`](./src/app/environments/worker.js) into the editor.
4. Save and deploy your Worker.
5. Use your Worker’s URL (e.g., `https://{worker-name}.{your-username}.workers.dev/api/leetcode/graphql`) as the API endpoint in your environment configuration.

## Building the Project

To build the project for production, run:
```bash
ng build --configuration=production
```

## Deploying with Firebase Hosting

1. Install the Firebase CLI:
    ```bash
    npm install -g firebase-tools
    ```
2. Log in to your Firebase account:
    ```bash
    firebase login
    ```
3. Initialize Firebase in your project directory:
    ```bash
    firebase init
    ```
    - Select **Hosting** and follow the prompts.
    - Set your public directory to `dist/` (or your Angular build output directory).
    - Enable single-page app configuration.

4. Deploy your app:
    ```bash
    firebase deploy
    ```

After deployment, your app will be available at the Firebase Hosting URL provided.
