export const environment = {
  production: true,
  apiUrl: 'https://{worker-name.your-username.workers.dev}/api/leetcode/graphql',
  // Direct API calls may fail due to CORS restrictions; use a proxy to forward requests.
  // To set up a proxy, deploy a Cloudflare Worker using the code in worker.js,
  // then update API calls to use your Cloudflare Worker URL.
  geminiApiKey: 'your-gemini-api-key',
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-firebase-auth-domain',
    projectId: 'your-firebase-project-id',
    storageBucket: 'your-firebase-storage-bucket',
    messagingSenderId: 'your-firebase-messaging-sender-id',
    appId: 'your-firebase-app-id',
  },
};

export default environment;
