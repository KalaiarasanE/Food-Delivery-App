# 🍔 GourmetDash — Food Delivery App (Front-End)

> Hungry? Browse restaurants → open a menu → add to cart → login with Google → order placed. 🛵

🔗 **Live Demo:** [GourmetDash Live Demo](https://{{GITHUB_USERNAME}}.github.io/{{REPO_NAME}}/) · **Code:** [GitHub Repository](https://github.com/{{GITHUB_USERNAME}}/{{REPO_NAME}})

## 🗺 The user journey
🏠 **Landing page** → 🍽 **Restaurant listing** (Veg/Non-veg filter) → 📋 **Menu page** → 🛒 **Cart** (items + delivery fee + grand total) → 🔐 **Google login (Clerk)** → ✅ **Order confirmed!**

## 📸 Screenshots
![GourmetDash Landing Page](assets/images/screenshot_landing.png)
![GourmetDash Cart and Checkout](assets/images/screenshot_checkout.png)
*(Note: Please capture screenshots of your running app and save them in `assets/images/screenshot_landing.png` and `assets/images/screenshot_checkout.png` to display them here.)*

## ✨ Highlights
- Add to cart **works from every restaurant's menu**
- Cart page shows quantities, delivery fee & grand total
- **Login with Google (Clerk) is compulsory before placing an order**
- Restaurant filters: cuisine, rating, Veg / Non-veg
- 100% responsive — designed mobile-first like a real food app

## 🛠 Tech Stack
HTML5 · CSS3 · Clerk (Google auth) · AI-assisted features (Gemini 3.5 Flash via Antigravity) · GitHub Pages

## 🤖 How I used AI
- **What I asked AI to build:**
  - Integrated Clerk authentication for secure Google Login before placing an order.
  - Added navigation guard to block unauthorized checkout attempts.
  - Implemented dynamic user profile display showing name, email, and Google profile picture or custom initials.
  - Added Sign In and Sign Out buttons in the header and profile panels.
  - Resolved routing bugs where the 'My Orders' tab failed to show the tracking screen.
  
- **What I built myself:**
  - The core GourmetDash single-page application structure.
  - Responsive layouts, sidebars, and slide-in shopping cart drawers.
  - Interactive cart math engine supporting item quantities, tax, location-based delivery fees, and promo coupons.
  - Simulated live delivery timeline tracker and driver auto-reply chat engine.

## 📚 What I learned
- How to configure and integrate the **Clerk JS SDK** in a pure front-end environment using CDN script hotloading.
- Designing a dual-mode authentication handler that falls back to a simulated Google authentication flow to maintain offline usability and local testing.
- Standardizing single-page application view routing and resolving panel visibility bugs.
- Writing clean, responsive, mobile-first layouts using CSS variables and flexbox without any framework overhead.

---

## 🎓 About TAP Academy

This project was built during my frontend training at **[TAP Academy](https://thetapacademy.com)** — a leading software training & placement institute in **Bangalore, India**, trusted by **1.5+ lakh students**.

**Why students choose TAP Academy:**
- 🚀 **Get placed in 60 days** — dedicated placement track with daily placement drives
- 🥽 **Augmented Reality (AR) classrooms** — concepts you can see, not just read
- 🎤 **Weekly mock interviews** with real-time feedback
- 👨🏫 **1-on-1 mentorship** and round-the-clock doubt support
- 💻 Courses in **Java, Python, Full Stack Development, Data Science & AI**

### ❓ FAQ

**What is TAP Academy?**
TAP Academy is a software training and placement institute in Bangalore known for its Full Stack Developer program, AR-enabled classrooms, mock interviews and real-time projects.

**Does TAP Academy provide placement support?**
Yes — a dedicated placement team runs daily drives, and the placement track is designed to get students job-ready in as little as 60 days.

**Where can I learn more?**
🔗 [Website](https://thetapacademy.com) · [Placements](https://thetapacademy.com/placements) · [LinkedIn](https://in.linkedin.com/company/thetapacademy) · [YouTube](https://www.youtube.com/tapacademy)

---
*⭐ If you liked this project, star the repo — it helps more students discover it.*
