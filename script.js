/**
 * GourmetDash - Food Delivery Application Logic
 * Core Engine & Interactive State (Vanilla JS ES6+)
 */

// ==========================================================================
// Clerk Integration & Authentication Setup
// ==========================================================================

// If you want to use real Clerk authentication, paste your Publishable Key here.
// Example: const CLERK_PUBLISHABLE_KEY = "pk_test_...";
// If left empty, the application automatically falls back to a beautifully simulated Clerk Google Login.
const CLERK_PUBLISHABLE_KEY = ""; 

const isClerkConfigured = () => {
  return typeof CLERK_PUBLISHABLE_KEY === 'string' && CLERK_PUBLISHABLE_KEY.trim().startsWith('pk_');
};

const MockAuth = {
  isSignedIn: false,
  user: null,

  init() {
    const savedUser = localStorage.getItem("gourmetdash_user");
    if (savedUser) {
      this.isSignedIn = true;
      this.user = JSON.parse(savedUser);
    }
  },

  signInWithGoogle() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser = {
          id: "user_" + Math.random().toString(36).substr(2, 9),
          firstName: "Kalaiarasan",
          lastName: "",
          fullName: "Kalaiarasan",
          primaryEmailAddress: { emailAddress: "km45182334@example.com" },
          imageUrl: ""
        };
        this.isSignedIn = true;
        this.user = mockUser;
        localStorage.setItem("gourmetdash_user", JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1200);
    });
  },

  signOut() {
    this.isSignedIn = false;
    this.user = null;
    localStorage.removeItem("gourmetdash_user");
  }
};

const Auth = {
  _onSuccessCallback: null,

  async init() {
    if (isClerkConfigured()) {
      try {
        const clerkObj = await this.waitForClerk();
        if (clerkObj) {
          await clerkObj.load({ publishableKey: CLERK_PUBLISHABLE_KEY });
          console.log("Clerk initialized successfully.");
          
          // Listen to state changes to sync UI
          clerkObj.addListener(({ user }) => {
            updateAuthUI();
          });
          return;
        } else {
          console.warn("Clerk SDK failed to load within timeout. Falling back to MockAuth.");
        }
      } catch (e) {
        console.error("Clerk initialization failed:", e);
      }
    }
    MockAuth.init();
  },

  waitForClerk() {
    return new Promise((resolve) => {
      if (window.Clerk) {
        resolve(window.Clerk);
        return;
      }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.Clerk) {
          clearInterval(interval);
          resolve(window.Clerk);
        } else if (attempts > 30) { // 3 seconds timeout
          clearInterval(interval);
          resolve(null);
        }
      }, 100);
    });
  },

  isSignedIn() {
    if (isClerkConfigured() && window.Clerk) {
      return window.Clerk.isSignedIn;
    }
    return MockAuth.isSignedIn;
  },

  getUser() {
    if (isClerkConfigured() && window.Clerk && window.Clerk.user) {
      const u = window.Clerk.user;
      return {
        fullName: u.fullName || (u.firstName + " " + (u.lastName || "")).trim() || "User",
        email: u.primaryEmailAddress ? u.primaryEmailAddress.emailAddress : "user@example.com",
        imageUrl: u.imageUrl || ""
      };
    }
    if (MockAuth.isSignedIn && MockAuth.user) {
      return {
        fullName: MockAuth.user.fullName,
        email: MockAuth.user.primaryEmailAddress.emailAddress,
        imageUrl: MockAuth.user.imageUrl
      };
    }
    return null;
  },

  openSignIn(onSuccess) {
    if (isClerkConfigured() && window.Clerk) {
      const container = document.getElementById("clerk-signin-container");
      container.innerHTML = "";
      document.getElementById("mock-auth-container").style.display = "none";
      document.getElementById("clerk-signin-container").style.display = "block";
      document.getElementById("auth-modal").classList.add("open-modal");
      
      window.Clerk.mountSignIn(container, {
        afterSignInUrl: window.location.href
      });
      return;
    }

    // Fallback Mock Login
    document.getElementById("clerk-signin-container").style.display = "none";
    document.getElementById("mock-auth-container").style.display = "block";
    document.getElementById("auth-modal").classList.add("open-modal");
    this._onSuccessCallback = onSuccess;
  },

  async handleMockSignIn() {
    const btn = document.getElementById("mock-google-login-btn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="splash-loader" style="width:16px; height:16px; border:2px solid var(--text-light); border-top-color:var(--primary); border-radius:50%; animation:beacon-pulse 1s infinite; display:inline-block; margin-right:8px; vertical-align:middle;"></span> Signing in...`;

    try {
      await MockAuth.signInWithGoogle();
      document.getElementById("auth-modal").classList.remove("open-modal");
      showToast("Successfully signed in with Google!");
      updateAuthUI();
      if (this._onSuccessCallback) {
        this._onSuccessCallback();
        this._onSuccessCallback = null;
      }
    } catch (e) {
      showToast("Sign in failed.", "danger");
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  async signOut() {
    if (isClerkConfigured() && window.Clerk) {
      await window.Clerk.signOut();
    } else {
      MockAuth.signOut();
    }
    showToast("Signed out successfully.", "info");
    updateAuthUI();
    switchView("restaurants");
  }
};

function setupAuth() {
  // Mock login button handler
  const googleBtn = document.getElementById("mock-google-login-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      Auth.handleMockSignIn();
    });
  }

  // Profile signout button handler
  const signOutBtn = document.getElementById("profile-signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => {
      Auth.signOut();
    });
  }

  // Profile signin button handler
  const signInBtn = document.getElementById("profile-signin-btn");
  if (signInBtn) {
    signInBtn.addEventListener("click", () => {
      Auth.openSignIn(() => {
        switchView("profile");
      });
    });
  }

  // Auth modal close button
  const closeBtn = document.getElementById("close-auth-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("auth-modal").classList.remove("open-modal");
      Auth._onSuccessCallback = null;
    });
  }

  // Auth modal backdrop click close
  const authModal = document.getElementById("auth-modal");
  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target === authModal) {
        authModal.classList.remove("open-modal");
        Auth._onSuccessCallback = null;
      }
    });
  }
}

function updateAuthUI() {
  const loggedInPanel = document.getElementById("profile-logged-in-state");
  const loggedOutPanel = document.getElementById("profile-logged-out-state");
  const userAvatar = document.getElementById("profile-user-avatar");
  const userName = document.getElementById("profile-user-name");
  const userEmail = document.getElementById("profile-user-email");

  if (Auth.isSignedIn()) {
    const user = Auth.getUser();
    if (user) {
      userName.textContent = user.fullName;
      userEmail.textContent = user.email;

      // Handle Avatar Image or Text Initials
      if (user.imageUrl) {
        userAvatar.innerHTML = `<img src="${user.imageUrl}" alt="${user.fullName}">`;
        userAvatar.style.backgroundColor = "transparent";
      } else {
        // Compute Initials
        const parts = user.fullName.split(" ");
        const initials = parts.map(p => p[0]).join("").toUpperCase().substring(0, 2);
        userAvatar.textContent = initials || "U";
        userAvatar.innerHTML = initials || "U";
        userAvatar.style.backgroundColor = "var(--primary-light)";
        userAvatar.style.color = "var(--primary)";
      }
    }
    if (loggedInPanel) loggedInPanel.style.display = "block";
    if (loggedOutPanel) loggedOutPanel.style.display = "none";
  } else {
    if (loggedInPanel) loggedInPanel.style.display = "none";
    if (loggedOutPanel) loggedOutPanel.style.display = "block";
  }
}

// ==========================================================================
// 1. Mock Database & Initial State Setup
// ==========================================================================

const AppState = {
  // Available delivery addresses
  addresses: {
    home: "124 Pine St, San Francisco, CA 94111",
    work: "1 Market St, San Francisco, CA 94105"
  },
  activeAddressKey: "home",

  // Promo Codes database
  coupons: {
    "BITE20": { type: "percent", value: 0.20, label: "20% OFF Subtotal" },
    "FREEDEL": { type: "freedel", value: 0, label: "Free Delivery" },
    "GIFT50": { type: "percent", value: 0.50, label: "50% OFF (Max ₹150)" }
  },

  // Restaurants & Menus listings
  restaurants: [
    {
      id: "rest1",
      name: "Gourmet Pizza Kitchen",
      cover: "assets/images/restaurant_pizza.jpg",
      rating: 4.8,
      cuisines: ["Pizza", "Italian", "Pasta", "Salads"],
      deliveryTime: "20-30 min",
      deliveryFee: 39,
      category: "pizza",
      description: "Artisanal pizzas baked in a traditional wood-fired oven. Fresh mozzarella, hand-stretched dough, and local organic ingredients.",
      menu: [
        {
          category: "Appetizers",
          items: [
            { id: "dish1", name: "Garlic Butter Dough Balls", price: 149, desc: "Freshly baked dough balls served with melted organic garlic butter dip.", tags: ["veg"], thumb: "assets/images/restaurant_pizza.jpg" },
            { id: "dish2", name: "Caprese Salad Salad", price: 199, desc: "Buffalo mozzarella, ripe heirloom tomatoes, sweet basil leaves, drizzled with aged balsamic glaze.", tags: ["veg"], thumb: "assets/images/restaurant_pizza.jpg" }
          ]
        },
        {
          category: "Main Courses",
          items: [
            { id: "dish3", name: "Classic Margherita Pizza", price: 349, desc: "Mozzarella, fresh basil leaves, house marinara sauce, drizzled with cold-pressed olive oil.", tags: ["veg"], thumb: "assets/images/restaurant_pizza.jpg" },
            { id: "dish4", name: "Diavola Spicy Pizza", price: 449, desc: "Spicy Italian salami, mozzarella, chili flakes, red onions, and hot honey glaze.", tags: ["spicy"], thumb: "assets/images/restaurant_pizza.jpg" },
            { id: "dish5", name: "Creamy Truffle Tagliatelle", price: 499, desc: "Hand-rolled tagliatelle pasta tossed in wild mushroom truffle cream sauce.", tags: ["veg"], thumb: "assets/images/restaurant_pizza.jpg" }
          ]
        },
        {
          category: "Desserts & Drinks",
          items: [
            { id: "dish6", name: "Signature Tiramisu", price: 229, desc: "Layers of espresso-soaked ladyfingers and velvety mascarpone cream.", tags: ["veg"], thumb: "assets/images/promo_banner.jpg" },
            { id: "dish7", name: "San Pellegrino Limonata", price: 89, desc: "Sparkling Italian lemon beverage.", tags: [], thumb: "assets/images/promo_banner.jpg" }
          ]
        }
      ]
    },
    {
      id: "rest2",
      name: "Burger Craft & Co.",
      cover: "assets/images/restaurant_burger.jpg",
      rating: 4.9,
      cuisines: ["Burgers", "American", "Sides", "Fast Food"],
      deliveryTime: "15-25 min",
      deliveryFee: 0, // Free Delivery
      category: "burger",
      description: "Gourmet double-stacked burgers, house-brined pickles, crispy hand-cut fries, and custom dipping sauces.",
      menu: [
        {
          category: "Starters",
          items: [
            { id: "dish8", name: "Loaded Truffle Fries", price: 199, desc: "Crispy skin-on fries, parmesan, white truffle oil, chopped chives, and garlic aioli.", tags: ["veg"], thumb: "assets/images/restaurant_burger.jpg" },
            { id: "dish9", name: "Crispy Buffalo Wings", price: 249, desc: "Tender wings glazed in signature buffalo sauce, served with blue cheese dip.", tags: ["spicy"], thumb: "assets/images/restaurant_burger.jpg" }
          ]
        },
        {
          category: "Craft Burgers",
          items: [
            { id: "dish10", name: "Classic Craft Cheeseburger", price: 299, desc: "Gourmet smash beef patty, sharp cheddar, pickles, house sauce, toasted brioche bun.", tags: [], thumb: "assets/images/restaurant_burger.jpg" },
            { id: "dish11", name: "The Double Bacon Stack", price: 449, desc: "Double smash patty, crispy maple wood bacon, double cheddar, caramelized onions.", tags: [], thumb: "assets/images/restaurant_burger.jpg" },
            { id: "dish12", name: "Smoky BBQ Jalapeno Burger", price: 399, desc: "Beef patty, smoked gouda, pickled jalapeños, tobacco onions, honey BBQ glaze.", tags: ["spicy"], thumb: "assets/images/restaurant_burger.jpg" }
          ]
        },
        {
          category: "Drinks & Sweets",
          items: [
            { id: "dish13", name: "Salted Caramel Milkshake", price: 179, desc: "Thick hand-spun vanilla bean ice cream mixed with home-style salted caramel.", tags: ["veg"], thumb: "assets/images/promo_banner.jpg" },
            { id: "dish14", name: "Craft Root Beer", price: 99, desc: "Local micro-brewed sweet root beer.", tags: [], thumb: "assets/images/promo_banner.jpg" }
          ]
        }
      ]
    },
    {
      id: "rest3",
      name: "Tokyo Sushi Club",
      cover: "assets/images/restaurant_sushi.jpg",
      rating: 4.7,
      cuisines: ["Sushi", "Japanese", "Healthy", "Asian"],
      deliveryTime: "30-40 min",
      deliveryFee: 59,
      category: "sushi",
      description: "Sustainably-sourced fresh fish, delicate nigiri platters, specialty maki rolls, and warm house-brewed edamame.",
      menu: [
        {
          category: "Appetizers",
          items: [
            { id: "dish15", name: "Spicy Garlic Edamame", price: 179, desc: "Steamed soybeans tossed in chili garlic crunch and sea salt flakes.", tags: ["veg", "spicy"], thumb: "assets/images/restaurant_sushi.jpg" },
            { id: "dish16", name: "Pork Gyoza Dumplings", price: 249, desc: "Pan-fried pork dumplings served with sweet chili dipping soy sauce.", tags: [], thumb: "assets/images/restaurant_sushi.jpg" }
          ]
        },
        {
          category: "Signature Rolls",
          items: [
            { id: "dish17", name: "Red Dragon Maki", price: 499, desc: "Shrimp tempura, cucumber inside, topped with fresh spicy tuna sashimi slices.", tags: ["spicy"], thumb: "assets/images/restaurant_sushi.jpg" },
            { id: "dish18", name: "Premium Salmon Nigiri Platter", price: 599, desc: "6 pieces of premium fatty salmon nigiri served with pickled ginger.", tags: [], thumb: "assets/images/restaurant_sushi.jpg" },
            { id: "dish19", name: "Rainbow California Roll", price: 449, desc: "Crab mix, avocado, cucumber, topped with assorted raw fish slices.", tags: [], thumb: "assets/images/restaurant_sushi.jpg" }
          ]
        },
        {
          category: "Drinks",
          items: [
            { id: "dish20", name: "Matcha Iced Latte", price: 129, desc: "Premium ceremonial Japanese stone-ground green tea over cold oat milk.", tags: ["veg"], thumb: "assets/images/promo_banner.jpg" }
          ]
        }
      ]
    }
  ],

  // Shopping Cart state
  cart: {
    items: [], // [{ id, name, price, qty, thumb, restId }]
    restaurantId: null,
    subtotal: 0,
    deliveryFee: 39,
    serviceTax: 49,
    appliedCoupon: null,
    discountAmount: 0,
    grandTotal: 0
  },

  // Active tracking order
  activeOrder: null,

  // Past Orders History
  pastOrders: [
    {
      id: "GD-84729",
      restaurantName: "Tokyo Sushi Club",
      date: "Jul 08, 2026",
      itemsText: "Red Dragon Maki x1, Spicy Garlic Edamame x1",
      totalPrice: 678
    },
    {
      id: "GD-72910",
      restaurantName: "Gourmet Pizza Kitchen",
      date: "Jun 30, 2026",
      itemsText: "Classic Margherita Pizza x2, Garlic Butter Dough Balls x1",
      totalPrice: 847
    }
  ],

  activeView: "restaurants"
};

// ==========================================================================
// 2. Initializer Routing & Bootstrapping
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupNavigation();
  setupModals();
  setupCategorySelector();
  setupSorting();
  setupCartDrawer();
  setupCheckoutPayment();
  setupRiderChat();
  setupAddressSelector();
  setupAuth();

  // Initialize Auth (Clerk or Mock)
  await Auth.init();
  updateAuthUI();

  // Initial Content Renderings
  renderRestaurants();
  renderPastOrders();
  syncCartUI();
});

// ==========================================================================
// 3. Global Helpers & Toast alerts
// ==========================================================================

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "";
  if (type === "success") {
    icon = `<svg viewBox="0 0 24 24" width="16" height="16" class="text-success"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
  } else {
    icon = `<svg viewBox="0 0 24 24" width="16" height="16" class="text-primary"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  }

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-exit");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3000);
}

// Format prices nicely
function formatPrice(number) {
  return `₹${Math.round(number)}`;
}

// ==========================================================================
// 4. Navigation & Theme Engine
// ==========================================================================

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const sun = toggleBtn.querySelector(".sun-icon");
  const moon = toggleBtn.querySelector(".moon-icon");

  const savedTheme = localStorage.getItem("food-theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    sun.style.display = "none";
    moon.style.display = "block";
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark-theme");
    if (isDark) {
      localStorage.setItem("food-theme", "dark");
      sun.style.display = "none";
      moon.style.display = "block";
      showToast("Dark mode enabled.", "info");
    } else {
      localStorage.setItem("food-theme", "light");
      sun.style.display = "block";
      moon.style.display = "none";
      showToast("Light mode enabled.", "info");
    }
  });
}

function setupNavigation() {
  const tabs = document.querySelectorAll(".nav-tab[data-view], .mobile-nav-tab[data-view]");
  
  // Clicking GourmetDash logo takes you back home
  document.getElementById("logo-btn").addEventListener("click", () => {
    switchView("restaurants");
  });

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetView = tab.getAttribute("data-view");
      switchView(targetView);
    });
  });
}

function switchView(viewName) {
  if (viewName === "checkout" && !Auth.isSignedIn()) {
    Auth.openSignIn(() => {
      switchView("checkout");
    });
    return;
  }
  if (AppState.activeView === viewName) return;
  AppState.activeView = viewName;

  // Sync nav tabs states
  const tabs = document.querySelectorAll(".nav-tab[data-view], .mobile-nav-tab[data-view]");
  tabs.forEach(tab => {
    if (tab.getAttribute("data-view") === viewName) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Switch display panels
  const panels = document.querySelectorAll(".view-panel");
  panels.forEach(p => {
    if (p.id === `${viewName}-view`) {
      p.classList.add("active-view");
    } else {
      p.classList.remove("active-view");
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================================================
// 5. Modal Managers & Location Selector
// ==========================================================================

function setupModals() {
  const addressModalBtn = document.getElementById("open-address-modal-btn");
  const addressModal = document.getElementById("address-modal");
  const addressClose = document.getElementById("close-address-modal");

  addressModalBtn.addEventListener("click", () => {
    addressModal.classList.add("open-modal");
  });

  addressClose.addEventListener("click", () => {
    addressModal.classList.remove("open-modal");
  });

  // Background overlay click closes
  addressModal.addEventListener("click", (e) => {
    if (e.target === addressModal) {
      addressModal.classList.remove("open-modal");
    }
  });
}

function setupAddressSelector() {
  const addressOptions = document.querySelectorAll(".address-option-item");
  const headerAddressLabel = document.getElementById("header-address-label");
  const checkoutAddressLabel = document.getElementById("checkout-address-detail");
  const checkoutAddressName = document.getElementById("checkout-address-name");

  addressOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      addressOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");

      const key = opt.getAttribute("data-addr").includes("Pine") ? "home" : "work";
      AppState.activeAddressKey = key;

      const addressStr = AppState.addresses[key];
      headerAddressLabel.textContent = addressStr;
      
      // Update checkout details
      checkoutAddressName.textContent = key === "home" ? "Home Delivery" : "Work Delivery";
      checkoutAddressLabel.textContent = addressStr;

      // Update Delivery fees depending on distance location
      if (key === "work") {
        AppState.cart.deliveryFee = 59;
      } else {
        const rest = AppState.restaurants.find(r => r.id === AppState.cart.restaurantId);
        AppState.cart.deliveryFee = rest ? rest.deliveryFee : 39;
      }

      // Re-trigger cart math
      recalculateCartTotals();
      syncCartUI();

      // Close modal
      document.getElementById("address-modal").classList.remove("open-modal");
      showToast(`Delivery location changed.`);
    });
  });

  // Change address button in checkout
  document.getElementById("change-address-checkout-btn").addEventListener("click", () => {
    document.getElementById("address-modal").classList.add("open-modal");
  });
}

// ==========================================================================
// 6. View 1: Restaurant Discovery Page Handlers
// ==========================================================================

function setupCategorySelector() {
  const pills = document.querySelectorAll("#category-pills-list .category-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      const catFilter = pill.getAttribute("data-category");
      filterRestaurants(catFilter, "");
    });
  });

  // Global navbar search input
  const searchInput = document.getElementById("global-food-search");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    // Auto shift back to home restaurants view if search is typed elsewhere
    if (AppState.activeView !== "restaurants" && AppState.activeView !== "menu") {
      switchView("restaurants");
    }

    // If menu is open, search highlights menu items, else filters restaurants
    if (AppState.activeView === "menu") {
      filterMenuItems(query);
    } else {
      filterRestaurants("all", query);
    }
  });
}

function setupSorting() {
  const sortBtns = document.querySelectorAll(".sort-controls .sort-btn");
  sortBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sortBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const sortType = btn.getAttribute("data-sort");
      sortRestaurants(sortType);
    });
  });
}

function renderRestaurants() {
  const grid = document.getElementById("restaurants-container");
  if (!grid) return;

  if (AppState.restaurants.length === 0) {
    grid.innerHTML = `<p class="text-muted" style="grid-column: span 3; text-align:center; padding: 40px 16px;">No restaurants found.</p>`;
    return;
  }

  grid.innerHTML = AppState.restaurants.map(rest => {
    const isFreeDel = rest.deliveryFee === 0;
    const delFeeText = isFreeDel ? `<span class="fee-free">FREE</span>` : `${formatPrice(rest.deliveryFee)}`;
    
    return `
      <div class="card restaurant-card" onclick="openRestaurantMenu('${rest.id}')">
        <div class="restaurant-cover-wrapper">
          <img src="${rest.cover}" alt="${rest.name}" class="restaurant-cover-img">
          <div class="restaurant-rating-badge">
            <span>⭐</span>
            <span>${rest.rating}</span>
          </div>
          <button class="restaurant-fav-btn" onclick="toggleFavoriteRestaurant(event, '${rest.id}')" aria-label="Favorite">
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>
        <div class="restaurant-info">
          <h4>${rest.name}</h4>
          <p class="restaurant-cuisines">${rest.cuisines.join(" • ")}</p>
          <div class="restaurant-details-row">
            <span>⚡ ${rest.deliveryTime}</span>
            <span>🚴 Fee: ${delFeeText}</span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function filterRestaurants(category, query) {
  const original = AppState.restaurants;
  
  AppState.restaurants = original.filter(r => {
    const matchesCategory = category === "all" || r.category === category;
    const matchesQuery = query === "" || 
                         r.name.toLowerCase().includes(query) || 
                         r.cuisines.some(c => c.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  renderRestaurants();
  AppState.restaurants = original; // Restore array references
}

function sortRestaurants(type) {
  const original = [...AppState.restaurants];
  
  if (type === "rating") {
    AppState.restaurants.sort((a, b) => b.rating - a.rating);
  } else if (type === "time") {
    // Parse time minutes integer
    AppState.restaurants.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
  } else if (type === "fee") {
    AppState.restaurants.sort((a, b) => a.deliveryFee - b.deliveryFee);
  }

  renderRestaurants();
  AppState.restaurants = original; // Restore
}

window.toggleFavoriteRestaurant = function(e, restId) {
  e.stopPropagation(); // Stop card click opening menu
  const btn = e.currentTarget;
  const isFav = btn.classList.toggle("favorited");
  if (isFav) {
    btn.querySelector("svg path").setAttribute("fill", "var(--primary)");
    showToast("Added to favorites!");
  } else {
    btn.querySelector("svg path").setAttribute("fill", "currentColor");
    showToast("Removed from favorites.", "info");
  }
};

window.claimPromoCode = function(code) {
  const input = document.getElementById("promo-code-input");
  input.value = code;
  showToast(`Promo code ${code} pasted in Cart. Open Cart to apply!`, "info");
  openCartDrawer();
};

// ==========================================================================
// 7. View 2: Restaurant Menu Details Page
// ==========================================================================

let activeOpenRestaurantId = null;

window.openRestaurantMenu = function(restId) {
  activeOpenRestaurantId = restId;
  const rest = AppState.restaurants.find(r => r.id === restId);
  if (!rest) return;

  // Build Hero Header DOM
  const heroContainer = document.getElementById("restaurant-hero-details");
  heroContainer.className = "card restaurant-hero-card";
  
  const isFreeDel = rest.deliveryFee === 0;
  const delFeeText = isFreeDel ? "Free Delivery" : formatPrice(rest.deliveryFee);

  heroContainer.innerHTML = `
    <div class="restaurant-hero-title-row">
      <h2>${rest.name}</h2>
      <div class="restaurant-hero-rating">⭐ ${rest.rating} <span class="text-light" style="font-size:11px; font-weight:400;">(250+ reviews)</span></div>
    </div>
    <p class="restaurant-hero-desc">${rest.description}</p>
    <div class="restaurant-hero-meta-grid">
      <div class="meta-block">
        <span class="meta-block-label">Cuisines</span>
        <span class="meta-block-val">${rest.cuisines.slice(0, 3).join(", ")}</span>
      </div>
      <div class="meta-block">
        <span class="meta-block-label">Delivery time</span>
        <span class="meta-block-val">⚡ ${rest.deliveryTime}</span>
      </div>
      <div class="meta-block">
        <span class="meta-block-label">Delivery fee</span>
        <span class="meta-block-val text-success bold">${delFeeText}</span>
      </div>
    </div>
  `;

  // Render Menu Sidebar Navigation Links
  const sidebar = document.getElementById("menu-categories-sidebar");
  sidebar.innerHTML = rest.menu.map((sec, idx) => {
    const isActive = idx === 0 ? "active" : "";
    return `
      <button class="menu-nav-link ${isActive}" onclick="scrollToMenuSection('${sec.category}', this)">
        ${sec.category}
      </button>
    `;
  }).join("");

  // Render Dishes List cards
  renderDishesList(rest.menu);

  // Switch View
  switchView("menu");
};

function renderDishesList(menu) {
  const container = document.getElementById("dishes-container");
  container.innerHTML = menu.map(section => {
    const sectionDishesHTML = section.items.map(dish => {
      // Check if item is already in cart to display Quantity controllers
      const cartItem = AppState.cart.items.find(i => i.id === dish.id);
      const isAdded = !!cartItem;

      // Handle item tag badges
      let tagHTML = "";
      if (dish.tags.includes("spicy")) {
        tagHTML += `<span class="tag-badge spicy">🌶️ Spicy</span>`;
      }
      if (dish.tags.includes("veg")) {
        tagHTML += `<span class="tag-badge veg">🥬 Veg</span>`;
      }

      // Quantity controls display
      const actionBtnHTML = isAdded 
        ? `<div class="qty-pill-btn">
            <button onclick="decrementDishQty('${dish.id}')">-</button>
            <span class="qty-val-txt">${cartItem.qty}</span>
            <button onclick="incrementDishQty('${dish.id}')">+</button>
           </div>`
        : `<button class="btn-add-cart-dish" onclick="addDishToCart('${dish.id}')">Add +</button>`;

      return `
        <div class="card dish-card" id="dish-row-${dish.id}">
          <div class="dish-info">
            <div class="dish-name-row">
              <h4>${dish.name}</h4>
              ${tagHTML}
            </div>
            <p class="dish-desc">${dish.desc}</p>
            <p class="dish-price-row">${formatPrice(dish.price)}</p>
          </div>
          <div class="dish-image-action-wrapper">
            <img src="${dish.thumb}" alt="Dish Image" class="dish-thumb">
            <div class="qty-btn-box" id="action-box-${dish.id}">
              ${actionBtnHTML}
            </div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div id="section-${section.category}">
        <h3 class="menu-section-header">${section.category}</h3>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom: 24px;">
          ${sectionDishesHTML}
        </div>
      </div>
    `;
  }).join("");
}

window.scrollToMenuSection = function(secName, btnElement) {
  // Highlight active link
  const links = document.querySelectorAll(".menu-sidebar-nav .menu-nav-link");
  links.forEach(l => l.classList.remove("active"));
  btnElement.classList.add("active");

  const element = document.getElementById(`section-${secName}`);
  if (element) {
    const offset = 88; // Offset header height
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};

function filterMenuItems(query) {
  const rest = AppState.restaurants.find(r => r.id === activeOpenRestaurantId);
  if (!rest) return;

  const filteredMenu = rest.menu.map(section => {
    const items = section.items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.desc.toLowerCase().includes(query)
    );
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  renderDishesList(filteredMenu);
}

// ==========================================================================
// 8. Interactive Cart Module
// ==========================================================================

function setupCartDrawer() {
  const drawerBtn = document.getElementById("cart-drawer-toggle-btn");
  const mobileCartBtn = document.getElementById("mobile-cart-btn");
  const overlay = document.getElementById("cart-drawer-overlay");
  const closeBtn = document.getElementById("close-cart-drawer-btn");

  const openDrawer = () => overlay.classList.add("open-drawer");
  const closeDrawer = () => overlay.classList.remove("open-drawer");

  drawerBtn.addEventListener("click", openDrawer);
  mobileCartBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDrawer();
  });

  // Apply Coupon code logic
  const applyPromoBtn = document.getElementById("apply-promo-btn");
  applyPromoBtn.addEventListener("click", () => {
    const code = document.getElementById("promo-code-input").value.toUpperCase().trim();
    applyCouponCode(code);
  });

  // Proceed to Checkout
  document.getElementById("checkout-redirect-btn").addEventListener("click", () => {
    if (AppState.cart.items.length === 0) return;
    closeDrawer();
    switchView("checkout");
  });
}

window.openCartDrawer = function() {
  document.getElementById("cart-drawer-overlay").classList.add("open-drawer");
};

// Add dish to cart logic
window.addDishToCart = function(dishId) {
  // Find dish detail
  let foundDish = null;
  let restId = null;
  
  for (let rest of AppState.restaurants) {
    for (let sec of rest.menu) {
      const match = sec.items.find(item => item.id === dishId);
      if (match) {
        foundDish = match;
        restId = rest.id;
        break;
      }
    }
    if (foundDish) break;
  }

  if (!foundDish) return;

  // Validation: Only one restaurant in cart at a time
  if (AppState.cart.restaurantId && AppState.cart.restaurantId !== restId) {
    const newRest = AppState.restaurants.find(r => r.id === restId);
    const oldRest = AppState.restaurants.find(r => r.id === AppState.cart.restaurantId);
    
    const confirmClear = confirm(`Your cart contains items from '${oldRest.name}'. Would you like to clear your cart and order from '${newRest.name}' instead?`);
    if (confirmClear) {
      clearCart();
    } else {
      return; // Stop
    }
  }

  // Set active cart restaurant
  AppState.cart.restaurantId = restId;
  const restObj = AppState.restaurants.find(r => r.id === restId);
  AppState.cart.deliveryFee = AppState.activeAddressKey === "work" ? 59 : restObj.deliveryFee;

  // Push to items array
  const existing = AppState.cart.items.find(i => i.id === dishId);
  if (existing) {
    existing.qty += 1;
  } else {
    AppState.cart.items.push({
      id: foundDish.id,
      name: foundDish.name,
      price: foundDish.price,
      qty: 1,
      thumb: foundDish.thumb,
      restId: restId
    });
  }

  // Refresh controls
  recalculateCartTotals();
  syncCartUI();
  
  // Re-render dish menu lists row to show `- Qty +`
  updateMenuDishActionBox(dishId);

  showToast(`${foundDish.name} added to cart.`);
};

function clearCart() {
  AppState.cart.items = [];
  AppState.cart.restaurantId = null;
  AppState.cart.appliedCoupon = null;
  AppState.cart.discountAmount = 0;
  AppState.cart.subtotal = 0;
  AppState.cart.grandTotal = 0;

  // Hide coupon badge
  document.getElementById("active-promo-badge").style.display = "none";
  document.getElementById("promo-code-input").value = "";

  recalculateCartTotals();
  syncCartUI();
  
  // Re-render menu lists if open
  if (AppState.activeView === "menu") {
    const rest = AppState.restaurants.find(r => r.id === activeOpenRestaurantId);
    if (rest) renderDishesList(rest.menu);
  }
}

window.incrementDishQty = function(dishId) {
  const item = AppState.cart.items.find(i => i.id === dishId);
  if (item) {
    item.qty += 1;
    recalculateCartTotals();
    syncCartUI();
    updateMenuDishActionBox(dishId);
  }
};

window.decrementDishQty = function(dishId) {
  const index = AppState.cart.items.findIndex(i => i.id === dishId);
  if (index !== -1) {
    const item = AppState.cart.items[index];
    item.qty -= 1;
    
    if (item.qty <= 0) {
      AppState.cart.items.splice(index, 1);
      if (AppState.cart.items.length === 0) {
        AppState.cart.restaurantId = null;
        AppState.cart.appliedCoupon = null;
        AppState.cart.discountAmount = 0;
        document.getElementById("active-promo-badge").style.display = "none";
        document.getElementById("promo-code-input").value = "";
      }
    }

    recalculateCartTotals();
    syncCartUI();
    updateMenuDishActionBox(dishId);
  }
};

function updateMenuDishActionBox(dishId) {
  const actionBox = document.getElementById(`action-box-${dishId}`);
  if (!actionBox) return; // If menu page isn't active

  const cartItem = AppState.cart.items.find(i => i.id === dishId);
  if (cartItem) {
    actionBox.innerHTML = `
      <div class="qty-pill-btn">
        <button onclick="decrementDishQty('${dishId}')">-</button>
        <span class="qty-val-txt">${cartItem.qty}</span>
        <button onclick="incrementDishQty('${dishId}')">+</button>
      </div>
    `;
  } else {
    actionBox.innerHTML = `<button class="btn-add-cart-dish" onclick="addDishToCart('${dishId}')">Add +</button>`;
  }
}

function recalculateCartTotals() {
  const cart = AppState.cart;

  // Subtotal Math
  cart.subtotal = cart.items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Coupon Discount calculation
  cart.discountAmount = 0;
  if (cart.appliedCoupon) {
    const promo = AppState.coupons[cart.appliedCoupon];
    if (promo) {
      if (promo.type === "percent") {
        const potentialDisc = cart.subtotal * promo.value;
        cart.discountAmount = cart.appliedCoupon === "GIFT50" ? Math.min(potentialDisc, 150) : potentialDisc;
      } else if (promo.type === "freedel") {
        cart.deliveryFee = 0;
      }
    }
  }

  // Total math
  if (cart.subtotal === 0) {
    cart.grandTotal = 0;
  } else {
    cart.grandTotal = (cart.subtotal + cart.deliveryFee + cart.serviceTax) - cart.discountAmount;
  }
}

function applyCouponCode(code) {
  const coupon = AppState.coupons[code];
  if (!coupon) {
    showToast("Invalid promo code.", "danger");
    return;
  }

  if (AppState.cart.subtotal === 0) {
    showToast("Add items to your cart first.", "danger");
    return;
  }

  AppState.cart.appliedCoupon = code;
  recalculateCartTotals();
  syncCartUI();

  // Show badge
  const badge = document.getElementById("active-promo-badge");
  badge.innerHTML = `
    <span>🎟️ Applied: ${code} (${coupon.label})</span>
    <button onclick="removeCouponCode()">&times;</button>
  `;
  badge.style.display = "flex";

  showToast(`Promo code '${code}' applied!`);
}

window.removeCouponCode = function() {
  AppState.cart.appliedCoupon = null;
  
  // Restore original delivery fee if freedel was removed
  const rest = AppState.restaurants.find(r => r.id === AppState.cart.restaurantId);
  AppState.cart.deliveryFee = AppState.activeAddressKey === "work" ? 59 : (rest ? rest.deliveryFee : 39);

  recalculateCartTotals();
  syncCartUI();

  document.getElementById("active-promo-badge").style.display = "none";
  document.getElementById("promo-code-input").value = "";
  showToast("Promo code removed.", "info");
};

function syncCartUI() {
  const itemsContainer = document.getElementById("cart-items-container");
  const qtyBadges = document.querySelectorAll(".cart-badge-count");
  const checkoutItems = document.getElementById("checkout-basket-items-list");
  
  // Total Quantity calculations
  const totalQty = AppState.cart.items.reduce((acc, i) => acc + i.qty, 0);
  qtyBadges.forEach(badge => {
    badge.textContent = totalQty;
  });

  // Toggle Cart empty states
  if (AppState.cart.items.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.9 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
        <p class="bold">Your cart is empty</p>
        <p class="text-muted" style="font-size:11px;">Add gourmet food items from restaurants to satisfy your hunger.</p>
      </div>
    `;
    
    // Disable drawer action button
    document.getElementById("checkout-redirect-btn").disabled = true;
    checkoutItems.innerHTML = `<p class="text-muted" style="font-size:12px; text-align:center;">Basket is empty.</p>`;
  } else {
    document.getElementById("checkout-redirect-btn").disabled = false;

    // Render Drawer Rows
    itemsContainer.innerHTML = AppState.cart.items.map(item => `
      <div class="cart-item-row" id="cart-row-${item.id}">
        <img src="${item.thumb}" alt="Item Thumb" class="cart-item-thumb">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <span class="cart-item-price">${formatPrice(item.price)}</span>
        </div>
        <div class="cart-item-actions">
          <div class="qty-pill-btn" style="height:24px; min-width:68px;">
            <button onclick="decrementDishQty('${item.id}')">-</button>
            <span class="qty-val-txt">${item.qty}</span>
            <button onclick="incrementDishQty('${item.id}')">+</button>
          </div>
        </div>
      </div>
    `).join("");

    // Render Checkout Column Items Summary list
    checkoutItems.innerHTML = AppState.cart.items.map(item => `
      <div class="checkout-basket-item-row">
        <span>${item.name} <strong class="text-muted">x${item.qty}</strong></span>
        <span>${formatPrice(item.price * item.qty)}</span>
      </div>
    `).join("");
  }

  // Render Math Pricing displays (Drawer)
  document.getElementById("cart-subtotal").textContent = formatPrice(AppState.cart.subtotal);
  document.getElementById("cart-delivery").textContent = formatPrice(AppState.cart.deliveryFee);
  
  const discountRow = document.getElementById("cart-discount-row");
  const discountSpan = document.getElementById("cart-discount");
  if (AppState.cart.discountAmount > 0) {
    discountRow.style.display = "flex";
    discountSpan.textContent = `-${formatPrice(AppState.cart.discountAmount)}`;
  } else {
    discountRow.style.display = "none";
  }
  
  document.getElementById("cart-grand-total").textContent = formatPrice(AppState.cart.grandTotal);

  // Render Math Pricing displays (Checkout screen)
  document.getElementById("checkout-subtotal").textContent = formatPrice(AppState.cart.subtotal);
  document.getElementById("checkout-delivery").textContent = formatPrice(AppState.cart.deliveryFee);
  document.getElementById("checkout-tax").textContent = formatPrice(AppState.cart.serviceTax);
  
  const checkoutDiscRow = document.getElementById("checkout-discount-row");
  const checkoutDiscSpan = document.getElementById("checkout-discount");
  if (AppState.cart.discountAmount > 0) {
    checkoutDiscRow.style.display = "flex";
    checkoutDiscSpan.textContent = `-${formatPrice(AppState.cart.discountAmount)}`;
  } else {
    checkoutDiscRow.style.display = "none";
  }
  
  document.getElementById("checkout-grand-total").textContent = formatPrice(AppState.cart.grandTotal);
}

// ==========================================================================
// 9. View 3: Checkout Page Operations
// ==========================================================================

function setupCheckoutPayment() {
  const methodCards = document.querySelectorAll(".payment-method-card");
  const cardForm = document.getElementById("card-payment-form");

  methodCards.forEach(card => {
    card.addEventListener("click", () => {
      methodCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");

      const method = card.getAttribute("data-method");
      if (method === "card") {
        cardForm.style.display = "flex";
      } else {
        cardForm.style.display = "none"; // Hide credit card fields for COD/PayPal
      }
    });
  });

  // Submit Order Placed
  document.getElementById("place-order-submit-btn").addEventListener("click", (e) => {
    e.preventDefault();

    if (AppState.cart.items.length === 0) return;

    // Validation checks if credit card option is active
    const activeMethod = document.querySelector(".payment-method-card.active").getAttribute("data-method");
    if (activeMethod === "card") {
      const num = document.getElementById("checkout-card-num").value.trim();
      const exp = document.getElementById("checkout-card-exp").value.trim();
      const cvv = document.getElementById("checkout-card-cvv").value.trim();

      if (num === "" || exp === "" || cvv === "") {
        showToast("Please fill in credit card details.", "danger");
        return;
      }
    }

    // Trigger visual Loading State
    const submitBtn = document.getElementById("place-order-submit-btn");
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="splash-loader" style="width:20px; height:20px; border-width: 2px; display:inline-block; margin-right:8px; vertical-align:middle;"></span> Processing Payment...`;

    setTimeout(() => {
      // Create order trace
      const restaurant = AppState.restaurants.find(r => r.id === AppState.cart.restaurantId);
      
      AppState.activeOrder = {
        id: "GD-" + Math.floor(10000 + Math.random() * 90000),
        restaurantName: restaurant ? restaurant.name : "Gourmet Kitchen",
        itemsText: AppState.cart.items.map(i => `${i.name} x${i.qty}`).join(", "),
        totalPrice: AppState.cart.grandTotal,
        date: "Today",
        statusStepIndex: 0,
        chatHistory: [
          { sender: "driver", text: "Hello! I am Johnny, your GourmetDash rider. I will update you as soon as I pick up your meal.", time: "Just now" }
        ]
      };

      // Reset Submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      // Reset cart completely
      clearCart();

      // Start Tracking simulations
      startTrackingSimulation();

      // Show Alerts badge
      document.getElementById("tracking-active-badge").style.display = "inline-block";

      // Switch view to live order tracker page
      switchView("orders");
      renderLiveTracking();

      showToast("Order placed successfully! Live tracking active.");

    }, 2000);
  });
}

// ==========================================================================
// 10. View 4: Live Order Tracking Page
// ==========================================================================

let simulationTimerId = null;

function startTrackingSimulation() {
  if (simulationTimerId) clearInterval(simulationTimerId);

  // Auto increment tracker stages periodically (every 15 seconds)
  simulationTimerId = setInterval(() => {
    if (!AppState.activeOrder) {
      clearInterval(simulationTimerId);
      return;
    }

    const o = AppState.activeOrder;
    if (o.statusStepIndex < 3) {
      o.statusStepIndex += 1;
      
      // Choose corresponding driver auto-chat response text
      const chats = o.chatHistory;
      const date = new Date();
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (o.statusStepIndex === 1) {
        chats.push({ sender: "driver", text: "Great news! The kitchen is finishing up your food. I am waiting inside.", time });
        showToast("Chef finished cooking. Order status updated!", "info");
      } else if (o.statusStepIndex === 2) {
        chats.push({ sender: "driver", text: "I have picked up your order! Food is packed hot in my thermal bag. I am biking your way.", time });
        showToast("Rider picked up your food. Johnny is heading to you!", "info");
      } else if (o.statusStepIndex === 3) {
        chats.push({ sender: "driver", text: "I have arrived at your building. Leaving the food at your doorstep as requested. Have a wonderful meal!", time });
        showToast("Johnny arrived! Food delivered successfully.");
        
        // Hide badge tracker
        document.getElementById("tracking-active-badge").style.display = "none";
        
        // Push this active tracking order to Past Orders history list
        AppState.pastOrders.unshift({
          id: o.id,
          restaurantName: o.restaurantName,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          itemsText: o.itemsText,
          totalPrice: o.totalPrice
        });
        
        renderPastOrders();
        clearInterval(simulationTimerId);
      }

      renderLiveTracking();
    }
  }, 15000);
}

function renderLiveTracking() {
  const trackingView = document.getElementById("orders-view");
  
  if (!AppState.activeOrder) {
    trackingView.innerHTML = `
      <div class="card" style="grid-column: span 2; text-align:center; padding: 60px 20px;">
        <svg viewBox="0 0 24 24" width="60" height="60" class="text-light" style="margin-bottom:12px;"><path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
        <h3>No active orders</h3>
        <p class="text-muted" style="font-size:12px; margin-top:4px;">You have no deliveries currently on the way. Head to Home to place an order.</p>
        <button class="btn btn-primary" onclick="switchView('restaurants')" style="margin-top:16px;">Order Food</button>
      </div>
    `;
    return;
  }

  // Restore regular template if order is active
  const o = AppState.activeOrder;
  
  // Update Header Labels
  document.getElementById("tracking-restaurant-name").textContent = o.restaurantName;
  document.getElementById("tracking-order-id").textContent = o.id;

  // Timeline UI updates
  const steps = ["placed", "preparing", "delivering", "arrived"];
  const currentIdx = o.statusStepIndex;

  // Calculate simulated ETA text
  let etaText = "15 mins";
  if (currentIdx === 1) etaText = "10 mins";
  if (currentIdx === 2) etaText = "5 mins";
  if (currentIdx === 3) etaText = "Arrived!";
  document.getElementById("tracking-eta").textContent = etaText;

  steps.forEach((step, idx) => {
    const el = document.getElementById(`step-${step}`);
    if (!el) return;

    if (idx < currentIdx) {
      el.className = "timeline-step active";
      el.querySelector(".step-indicator").textContent = "✓";
    } else if (idx === currentIdx) {
      el.className = "timeline-step pulse-active";
      el.querySelector(".step-indicator").textContent = "●";
    } else {
      el.className = "timeline-step";
      el.querySelector(".step-indicator").textContent = "";
    }
  });

  // Render Rider Chat list
  const chatContainer = document.getElementById("driver-chat-container");
  chatContainer.innerHTML = o.chatHistory.map(m => {
    const isCustomer = m.sender === "customer";
    return `
      <div class="chat-bubble ${isCustomer ? 'customer' : 'rider'}">
        ${m.text}
      </div>
    `;
  }).join("");

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function setupRiderChat() {
  const input = document.getElementById("driver-chat-input");
  const sendBtn = document.getElementById("send-driver-msg-btn");

  const sendMsg = () => {
    const text = input.value.trim();
    if (text === "" || !AppState.activeOrder) return;

    const date = new Date();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append customer message
    AppState.activeOrder.chatHistory.push({
      sender: "customer",
      text: text,
      time
    });

    input.value = "";
    renderLiveTracking();

    // Johnny Driver Auto response simulations
    simulateRiderReply(text);
  };

  sendBtn.addEventListener("click", sendMsg);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMsg();
    }
  });
}

function simulateRiderReply(customerMsg) {
  const currentIdx = AppState.activeOrder.statusStepIndex;
  
  // Rider response quotes base depending on step
  let response = "Thanks! I'll keep that in mind.";
  if (currentIdx === 0) {
    response = "Will do! The kitchen is still prepping, I'll grab it as soon as they call.";
  } else if (currentIdx === 1) {
    response = "Sounds good! Still waiting on the chef, shouldn't be much longer.";
  } else if (currentIdx === 2) {
    response = "Got it! Biking as fast as I can, should arrive in 4-5 minutes.";
  } else if (currentIdx === 3) {
    response = "Awesome! Already delivered. Enjoy your hot food!";
  }

  setTimeout(() => {
    if (!AppState.activeOrder) return;
    
    const date = new Date();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    AppState.activeOrder.chatHistory.push({
      sender: "driver",
      text: response,
      time
    });

    renderLiveTracking();
    showToast("New message from Johnny Rider", "info");

  }, 1500);
}

// ==========================================================================
// 11. View 5: User Profile & History
// ==========================================================================

function renderPastOrders() {
  const container = document.getElementById("past-orders-container");
  if (!container) return;

  if (AppState.pastOrders.length === 0) {
    container.innerHTML = `<p class="text-muted" style="font-size:12px;">You haven't ordered anything yet.</p>`;
    return;
  }

  container.innerHTML = AppState.pastOrders.map(order => `
    <div class="past-order-card" id="past-order-${order.id}">
      <div class="past-order-header">
        <h4>${order.restaurantName}</h4>
        <span class="text-light" style="font-size:11px;">Order ID: #${order.id}</span>
      </div>
      <p class="past-order-details text-muted">${order.itemsText}</p>
      <div class="past-order-footer">
        <span class="order-total-price bold">${formatPrice(order.totalPrice)}</span>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="text-light" style="font-size:11px;">${order.date}</span>
          <button class="btn btn-outline btn-sm" onclick="reorderItems('${order.id}')">Reorder</button>
        </div>
      </div>
    </div>
  `).join("");
}

// Re-order past cart invoice items
window.reorderItems = function(orderId) {
  const order = AppState.pastOrders.find(o => o.id === orderId);
  if (!order) return;

  // Clear cart first
  clearCart();

  // Find corresponding restaurant match
  const rest = AppState.restaurants.find(r => r.name === order.restaurantName);
  if (!rest) return;

  // Parse items from invoice text (e.g. "Classic Margherita Pizza x2, Garlic Butter Dough Balls x1")
  const itemsArray = order.itemsText.split(", ");
  itemsArray.forEach(str => {
    const match = str.match(/(.+) x(\d+)/);
    if (match) {
      const name = match[1].trim();
      const qty = parseInt(match[2]);

      // Seek dish ID matching name inside this restaurant's menu
      let dishId = null;
      for (let sec of rest.menu) {
        const dish = sec.items.find(i => i.name === name);
        if (dish) {
          dishId = dish.id;
          break;
        }
      }

      if (dishId) {
        // Add to cart multiple times based on quantity
        for (let q = 0; q < qty; q++) {
          addDishToCart(dishId);
        }
      }
    }
  });

  openCartDrawer();
  showToast(`Items from order #${orderId} copied back to your Cart.`);
};
