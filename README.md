<p align="center">
  <a href="https://sofilmy.vercel.app/">
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1758299986/Ping_Nest_8_fd2n08.png" alt="SoFilmy Logo" width="280" />
  </a>
</p>

<blockquote>
  <strong>Note:</strong> SoFilmy is a social platform for cinephiles to post film thoughts, analyze scenes, and connect over cinema.
</blockquote>

<h1 align="center">SoFilmy</h1>

<p align="center">
  <em> "Sofilmy – Where every cinephile’s reel meets for real! From mood-based picks to epic debates, lights, camera… connect!" 🎥</em>
</p>

<hr />

<h2>🔥 Features</h2>

<ul>
  <li><strong>✅ Film Thought Sharing:</strong> Users can create detailed posts about movies they've watched recently.</li>
  <li><strong>✅ Real-Time Discussion:</strong> Chat system lets cinephiles connect and converse instantly.</li>
  <li><strong>✅ Post Upvotes & Ratings:</strong> Users can give star-based feedback to others' thoughts and reviews.</li>
  <li><strong>✅ Comments:</strong> Engage in thread-style conversations under each post.</li>
  <li><strong>✅ Phone-Based Auth:</strong> Sign in via phone number with OTP verification (Firebase).</li>
  <li><strong>✅ Realtime Database Sync:</strong> Posts and chats update in real-time via Firebase backend.</li>
</ul>

<hr />

<h2>🛠 Tech Stack</h2>

<table>
  <tr><th>Technology</th><th>Description</th></tr>
  <tr><td><strong>React.js</strong></td><td>Frontend Framework</td></tr>
  <tr><td><strong>Firebase Auth</strong></td><td>Phone number login with OTP verification</td></tr>
  <tr><td><strong>Firebase Realtime DB / Firestore</strong></td><td>Post & Chat Storage</td></tr>
  <tr><td><strong>Firebase Hosting</strong></td><td>Deployment Platform</td></tr>
</table>

<hr />

<h2>📲 Getting Started</h2>

<h3>Clone the Repository</h3>
<pre><code>git clone https://github.com/blackcat-007/...sofilmy.git
cd ...sofilmy
</code></pre>

<h3>Install Dependencies</h3>
<pre><code>npm install</code></pre>

<h3>Firebase Setup</h3>
<p>Make sure you configure Firebase properly:</p>
<ol>
  <li>Create a Firebase project.</li>
  <li>Enable Phone Authentication.</li>
  <li>Setup Firestore/Realtime Database structure for posts, comments, and chats.</li>
  <li>Replace Firebase config in your code with your project credentials.</li>
</ol>

<h3>Run Locally</h3>
<pre><code>npm start</code></pre>

<p>The app will run at <code>http://localhost:3000</code></p>

<hr />

<h2>⚙️ Core Modules</h2>

<h3>🎥 Post Feature</h3>
<ul>
  <li>Create posts with text + optional image/video links</li>
  <li>Posts are timestamped and stored in database</li>
</ul>

<h3>📝 Comment Section</h3>
<ul>
  <li>Comment threads under every post</li>
  <li>Realtime update of new replies</li>
</ul>

<h3>⭐ Upvote System</h3>
<ul>
  <li>Users can react with stars (1–5) based on how insightful a post is</li>
</ul>

<h3>💬 Chat Integration</h3>
<ul>
  <li>Global chat for all users</li>
  <li>Real-time messaging using Firebase backend</li>
</ul>

<h3>📱 OTP Login</h3>
<ul>
  <li>Secure login using mobile phone OTP system</li>
  <li>No need for email/password</li>
</ul>

<hr />

<h2>🚀 Deployment</h2>
<ul>
  <li>Hosted on Firebase Hosting</li>
  <li>Run <code>npm run build</code> and deploy via Firebase CLI</li>
</ul>

<hr />

<h2>🔒 Security</h2>
<ul>
  <li>Firebase rules enforce read/write protection</li>
  <li>OTP validation and Firebase Auth secure the login process</li>
</ul>
---

## ☁️ Why Firebase?

Firebase was chosen for **SoFilmy** because it perfectly matches the needs of a real-time, community-driven social platform:

- 🔐 **Authentication Simplicity & Security**  
  Firebase Auth with phone-based OTP allows a smooth, email-free sign-in flow that resonates well with mobile-first users. This reduces friction and increases user trust by using verified numbers.
  
- ⚡ **Real-Time Interactions with Realtime DB**  
  For the chat system and dynamic post updates, Firebase’s Realtime Database ensures low-latency data syncing, enabling messages and interactions to appear instantly — exactly what’s expected in a live discussion platform.

- 📦 **Scalable Data Storage (Firestore)**  
  Posts, comments, and ratings are stored in **Cloud Firestore** for structured, scalable, and indexed access — ideal for threaded discussions and analytics.

- 🚀 **Hosting & Integration**  
  Firebase Hosting provides fast CDN-backed deployment with seamless CI/CD integration, enabling global users to access SoFilmy without lag.

- 🔁 **Tight Coupling Between Frontend & Backend**  
  Firebase’s SDKs allow direct client-to-backend communication, reducing boilerplate code, accelerating development, and avoiding traditional REST API overhead.

---

## 📈 Scaling Strategy & Thoughtful Architecture

SoFilmy is designed with long-term growth in mind. Here's how it’s built to scale:

- 📊 **Firestore Indexing**  
  Collections are structured with indexes on timestamps, post popularity, and user activity, ensuring queries remain fast even with thousands of entries.

- 🧵 **Pagination for Performance**  
  Posts and comment threads are paginated to prevent over-fetching data. The UI fetches a limited number of entries initially and loads more on scroll.

- 🧼 **Chat Cleanup & Archiving Strategy**  
  Old global chat messages are auto-cleaned or offloaded after a retention period using background Firebase Functions (to be integrated). This reduces load while keeping the system lean.

- 🚦 **Throttling & Write Rules**  
  Firebase security rules and basic rate limiting are implemented to prevent abuse — for example, preventing too many writes in a short period from a single user.

- 🧠 **Future Plan: Firebase Functions**  
  Planned use of **Cloud Functions** for:
  - Notification dispatch
  - Automated moderation of flagged content
  - Scheduled cleanup or archiving of stale content

- 🔐 **Robust Security Rules**  
  - Only authenticated users can post or chat  
  - Users can only modify their own posts  
  - Chat access is controlled globally to prevent spamming  
  - Rules are tested and versioned in the Firebase console

---

## 🧠 TL;DR – Firebase in SoFilmy Is Not Just a Shortcut

Firebase wasn’t used because it's "easy" — it was chosen because it **aligns perfectly** with the architecture of a modern, real-time social platform:

✅ Fast to deploy  
✅ Real-time performance  
✅ Secure and scalable out-of-the-box  
✅ Frontend-first, backend-powerful
---


<hr />

<h2>📄 License</h2>
<p>This project is licensed under the <strong><a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache License 2.0</a></strong>.</p>
<p>&copy; 2025 Shubho. All rights reserved under the Apache License 2.0.</p>

<hr />

<h2>👨‍💻 Author</h2>
<p>Built with ❤️ by <a href="https://github.com/blackcat-007">Shubho (blackcat-007)</a></p>

<h2>🤝 Contributing</h2>
<p>Want to improve SoFilmy? Fork the repo and open a PR!</p>

<h2>💬 Contact</h2>
<ul>
  <li><a href="https://github.com/blackcat-007">GitHub</a></li>
 <li><a href="https://linkedin.com/in/shubhodeepmukherjeewebdev">LinkedIn</a></li>
 <li><a href="shubhodeepmukherjee24@gmail.com">Gmail</a></li>
</ul>

<hr />

<h2>📸 Previews</h2>
 <p align="center">
  <strong>Landing Page (if not logged/signed up)</strong><br>
 
   <a href="https://res.cloudinary.com/ddcdrrav8/video/upload/v1755361269/sofiilmycompressed_w7yary.mp4">
 <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1755360951/Screenshot_2025-08-16_213038_oc6hnd.png" width="600" />
     </a>
</p>

<p align="center">
  <strong>Sign in & Sign up with quick email id verification system</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1755449835/Screenshot_2025-08-17_222406_xwkwyc.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1755449819/Screenshot_2025-08-17_222343_dejklz.png" width="600" />
</p>

<p align="center">
  <strong>Home Page(if logged in)</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757434143/Screenshot_2025-09-09_213752_y3nda4.png" width="600" />
</p>

<p align="center">
  <strong>Film Analysis section</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1756576917/Screenshot_2025-08-30_232817_waw3ey.png" width="600" />
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1752395201/Screenshot_2025-07-13_135347_ixpibn.png" width="600" />
</p>

<p align="center">
  <strong>New Post Section</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1756576889/Screenshot_2025-08-30_232842_poxxtv.png" width="600" />
    <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1756576902/Screenshot_2025-08-30_232901_kwgjcu.png" width="600" />
</p>

<p align="center">
  <strong>Dedicated Discussion Room for cinephiles all over the world with create private/public group feature</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1755360989/Screenshot_2025-08-16_213309_w4zrud.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757353231/Screenshot_2025-09-08_230850_j8szt4.png" width="600" />
    <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757353230/Screenshot_2025-09-08_230833_aigdjd.png" width="600" />
     <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757871389/Screenshot_2025-09-14_230519_op1qto.png" width="600" />
    
  
</p>
<p align="center">
  <strong>Explore page to get updated with new trending/popular films& shows along with trailers</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352290/Screenshot_2025-09-08_225209_gyutgy.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352291/Screenshot_2025-09-08_225231_qp4ptn.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352291/Screenshot_2025-09-08_225242_asiag3.png" width="600" />
</p>
<p align="center">
  <strong>Get suggestion based on genre per mood mapping</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352291/Screenshot_2025-09-08_225256_em9mt9.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352290/Screenshot_2025-09-08_225314_mxl0k5.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352293/Screenshot_2025-09-08_225326_xxhufa.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757352292/Screenshot_2025-09-08_225338_to3rpc.png" width="600" />
</p>
<p align="center">
  <strong>Dedicated personal profile & follow new profile</strong><br>
  <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757353047/Screenshot_2025-09-08_230528_hgxatw.png" width="600" />
   <img src="https://res.cloudinary.com/ddcdrrav8/image/upload/v1757353050/Screenshot_2025-09-08_230549_m6zgky.png" width="600" />
  
</p>
## 🚧 Planned & Future Features

To continue evolving SoFilmy into a more powerful, community-driven cinephile network, several features are under consideration and/or in active planning:

### 💬 Direct Messaging (DM)
- One-to-one chat system for private film discussions
- Delivered via Firebase Realtime Database or Firestore subcollections
- Optional message encryption for privacy

### 🔔 Push Notifications
- Browser and mobile push for:
  - New comments/replies on your post
  - Reactions to your reviews
  - New chat messages in discussion rooms
- Will use Firebase Cloud Messaging (FCM)

### 🏷️ User Tagging System
- Mention users with `@username` in posts/comments
- Tagged users receive instant notifications
- Enables directed discussion threads and collaboration

### 📌 Saved Posts & Watchlist
- Users can bookmark insightful reviews or film analyses
- Integrated with personal dashboards
- Future feature: sync watch history with other streaming platforms

### 📈 Community Leaderboard
- Gamified experience for top reviewers, most liked posts, etc.
- Encourages quality contributions and consistent engagement
- Can organise movie watch parties where cinephiles can watch a film together

### 🛠 Admin & Moderation Panel
- Admin dashboard for managing flagged posts or users
- Auto-moderation using Firebase Functions + custom logic

### 🌐 Multi-Room Chat / Topic Channels
- Themed chat rooms by genre (e.g., Sci-Fi Club, Indie Buffs, etc.)
- Room creation with user-generated tags

### 📊 Analytics Dashboard (for Admins)
- Track user activity, post reach, and platform engagement
- Helps guide content moderation and feature decisions

---

🎯 These future features will gradually roll out as SoFilmy grows, enhancing both social interactivity and content depth for cinephiles around the world.
