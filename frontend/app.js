// ==========================================
// NeedFinder Global - Complete Application Logic
// ==========================================

let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  setupApplication();
});

function setupApplication() {
  setupSearch();
  setupRequirementForm();
  setupCategoryButtons();
  setupNavigation();
  initializeAuth();
}


// ==========================================
// AUTHENTICATION
// ==========================================

async function initializeAuth() {
  try {
    if (
      typeof supabaseClient === "undefined" ||
      !supabaseClient.auth
    ) {
      console.error("Supabase client is not available.");
      return;
    }

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    currentUser =
      data.session ? data.session.user : null;

    updateAuthUI();

    supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        currentUser =
          session ? session.user : null;

        updateAuthUI();
      }
    );

  } catch (error) {
    console.error(
      "Authentication initialization error:",
      error
    );
  }
}


// ==========================================
// LOGIN / SIGN UP
// ==========================================

async function loginUser() {
  const email = prompt("Enter your email address:");

  if (!email) return;

  const password = prompt("Enter your password:");

  if (!password) return;

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

    if (error) throw error;

    currentUser = data.user || null;

    updateAuthUI();

    alert("✅ Login successful!");

  } catch (error) {
    console.error("Login error:", error);

    alert(
      "❌ Login failed:\n\n" +
      error.message
    );
  }
}


async function signUpUser() {
  const email = prompt("Enter your email address:");

  if (!email) return;

  const password =
    prompt("Create a password (minimum 6 characters):");

  if (!password) return;

  if (password.length < 6) {
    alert(
      "Password must contain at least 6 characters."
    );
    return;
  }

  try {
    const { data, error } =
      await supabaseClient.auth.signUp({
        email: email.trim(),
        password: password
      });

    if (error) throw error;

    currentUser = data.session
      ? data.session.user
      : null;

    updateAuthUI();

    if (data.session) {
      alert(
        "✅ Account created successfully!"
      );
    } else {
      alert(
        "✅ Account created!\n\n" +
        "Please check your email to confirm your account."
      );
    }

  } catch (error) {
    console.error("Sign up error:", error);

    alert(
      "❌ Sign Up failed:\n\n" +
      error.message
    );
  }
}


async function logoutUser() {
  try {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) throw error;

    currentUser = null;

    updateAuthUI();

    alert("✅ Logged out successfully.");

  } catch (error) {
    console.error("Logout error:", error);

    alert(
      "❌ Logout failed:\n\n" +
      error.message
    );
  }
}


// ==========================================
// AUTH UI
// ==========================================

function updateAuthUI() {
  const userEmail =
    document.getElementById("userEmail");

  const loginButton =
    document.getElementById("loginButton");

  const signupButton =
    document.getElementById("signupButton");

  const logoutButton =
    document.getElementById("logoutButton");

  if (
    !userEmail ||
    !loginButton ||
    !signupButton ||
    !logoutButton
  ) {
    return;
  }

  if (currentUser) {

    userEmail.textContent =
      currentUser.email || "Logged in";

    userEmail.classList.remove("hidden");

    loginButton.classList.add("hidden");

    signupButton.classList.add("hidden");

    logoutButton.classList.remove("hidden");

  } else {

    userEmail.textContent = "";

    userEmail.classList.add("hidden");

    loginButton.classList.remove("hidden");

    signupButton.classList.remove("hidden");

    logoutButton.classList.add("hidden");
  }
}


// ==========================================
// SEARCH
// ==========================================

function setupSearch() {
  const searchButton =
    document.getElementById("searchButton");

  if (!searchButton) {
    return;
  }

  searchButton.addEventListener(
    "click",
    searchRequirements
  );
}


async function searchRequirements() {

  const searchInput =
    document.getElementById("searchInput");

  const countrySelect =
    document.getElementById("countrySelect");

  const results =
    document.getElementById("searchResults");

  const search =
    searchInput
      ? searchInput.value.trim()
      : "";

  const country =
    countrySelect
      ? countrySelect.value.trim()
      : "";

  if (!search && !country) {
    alert(
      "Please enter a product, service, job or other need, or select a country."
    );
    return;
  }

  // Create result area if index.html does not have one
  let resultBox = results;

  if (!resultBox) {

    resultBox =
      document.createElement("div");

    resultBox.id = "searchResults";

    resultBox.className = "container";

    resultBox.style.padding = "30px 0";

    const hero =
      document.querySelector(".hero");

    if (hero) {
      hero.after(resultBox);
    } else {
      document.body.prepend(resultBox);
    }
  }

  resultBox.innerHTML = `
    <div style="
      background:#fff;
      padding:20px;
      border-radius:12px;
      text-align:center;
      border:1px solid #e5e7eb;
    ">
      Searching...
    </div>
  `;

  try {

    let query =
      supabaseClient
        .from("requirements")
        .select("*")
        .eq("status", "open")
        .order(
          "created_at",
          {
            ascending: false
          }
        )
        .limit(100);

    /*
      Search across:
      - title
      - details
      - category
      - location
    */

    if (search) {

      const safeSearch =
        escapeQuery(search);

      query =
        query.or(
          "title.ilike.%" +
          safeSearch +
          "%," +
          "details.ilike.%" +
          safeSearch +
          "%," +
          "category.ilike.%" +
          safeSearch +
          "%," +
          "location.ilike.%" +
          safeSearch +
          "%"
        );
    }

    if (country) {

      const safeCountry =
        escapeQuery(country);

      query =
        query.ilike(
          "location",
          "%" + safeCountry + "%"
        );
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    displaySearchResults(
      data || []
    );

  } catch (error) {

    console.error(
      "Search error:",
      error
    );

    resultBox.innerHTML = `
      <div style="
        background:#fee2e2;
        color:#991b1b;
        padding:20px;
        border-radius:12px;
      ">
        ❌ Search failed.<br><br>
        ${escapeHTML(error.message)}
      </div>
    `;
  }
}


// ==========================================
// DISPLAY SEARCH RESULTS
// ==========================================

function displaySearchResults(
  requirements
) {

  let results =
    document.getElementById(
      "searchResults"
    );

  if (!results) {

    results =
      document.createElement("div");

    results.id = "searchResults";

    results.className = "container";

    results.style.padding = "30px 0";

    const hero =
      document.querySelector(".hero");

    if (hero) {
      hero.after(results);
    } else {
      document.body.prepend(results);
    }
  }

  if (!requirements.length) {

    results.innerHTML = `
      <div style="
        background:#fff;
        border:1px solid #e5e7eb;
        border-radius:15px;
        padding:30px;
        text-align:center;
      ">

        <h3>No requirements found</h3>

        <p style="margin-top:8px;color:#6b7280;">
          No matching open requirements were found.
        </p>

        <p style="margin-top:8px;color:#6b7280;">
          Try another product, service, category or country.
        </p>

      </div>
    `;

    return;
  }

  results.innerHTML = `

    <div style="margin-bottom:20px;">
      <h2>
        Search Results
      </h2>

      <p style="color:#6b7280;">
        ${requirements.length}
        matching requirement(s) found
      </p>
    </div>

    <div style="
      display:grid;
      grid-template-columns:
      repeat(auto-fit,minmax(280px,1fr));
      gap:18px;
    ">

      ${requirements.map(
        requirement => `

        <div
          class="requirement-card"
          style="
            background:#fff;
            border:1px solid #e5e7eb;
            border-radius:15px;
            padding:22px;
            box-shadow:0 5px 20px rgba(0,0,0,.05);
          "
        >

          <div style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            margin-bottom:12px;
          ">

            <span style="
              background:#e5edff;
              color:#1457d9;
              padding:5px 9px;
              border-radius:20px;
              font-size:12px;
              font-weight:700;
            ">
              ${escapeHTML(
                requirement.category || "Other"
              )}
            </span>

            <span style="
              color:#15803d;
              font-size:12px;
              font-weight:700;
            ">
              ${escapeHTML(
                requirement.status || "open"
              )}
            </span>

          </div>

          <h3 style="margin-bottom:10px;">
            ${escapeHTML(
              requirement.title || ""
            )}
          </h3>

          <p style="
            color:#596579;
            margin-bottom:15px;
          ">
            ${escapeHTML(
              requirement.details || ""
            )}
          </p>

          <div style="
            color:#4b5563;
            margin-bottom:8px;
          ">
            📍 ${escapeHTML(
              requirement.location || ""
            )}
          </div>

          <small style="color:#7b8494;">
            Posted:
            ${formatDate(
              requirement.created_at
            )}
          </small>

        </div>

      `
      ).join("")}

    </div>
  `;

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// ==========================================
// REQUIREMENT FORM
// ==========================================

function setupRequirementForm() {

  const form =
    document.querySelector(
      "#requirementForm form"
    );

  if (!form) {
    return;
  }

  form.addEventListener(
    "submit",
    submitRequirement
  );
}


async function submitRequirement(event) {

  event.preventDefault();

  if (!currentUser) {

    alert(
      "🔐 Please Login or Sign Up before posting a requirement."
    );

    openAuth("login");

    return;
  }

  const titleElement =
    document.getElementById(
      "needTitle"
    );

  const categoryElement =
    document.getElementById(
      "needCategory"
    );

  const locationElement =
    document.getElementById(
      "needLocation"
    );

  const detailsElement =
    document.getElementById(
      "needDetails"
    );

  if (
    !titleElement ||
    !categoryElement ||
    !locationElement ||
    !detailsElement
  ) {

    alert(
      "Requirement form fields are missing."
    );

    return;
  }

  const title =
    titleElement.value.trim();

  const category =
    categoryElement.value.trim();

  const location =
    locationElement.value.trim();

  const details =
    detailsElement.value.trim();

  if (
    !title ||
    !category ||
    !location ||
    !details
  ) {

    alert(
      "Please complete all fields."
    );

    return;
  }

  const submitButton =
    event.target.querySelector(
      "button[type='submit']"
    );

  if (submitButton) {

    submitButton.disabled = true;

    submitButton.textContent =
      "Submitting...";
  }

  try {

    const insertData = {
      title: title,
      category: category,
      location: location,
      details: details,
      status: "open"
    };

    /*
      Add user_id only when the database
      has this column.
    */

    const { data, error } =
      await supabaseClient
        .from("requirements")
        .insert(insertData)
        .select()
        .single();

    if (error) {
      throw error;
    }

    alert(
      "✅ Requirement submitted successfully!\n\n" +
      "Reference ID: " +
      data.id
    );

    event.target.reset();

    const searchResults =
      document.getElementById(
        "searchResults"
      );

    if (searchResults) {
      searchResults.innerHTML = "";
    }

  } catch (error) {

    console.error(
      "Supabase requirement error:",
      error
    );

    alert(
      "❌ Requirement could not be submitted.\n\n" +
      error.message
    );

  } finally {

    if (submitButton) {

      submitButton.disabled = false;

      submitButton.textContent =
        "Submit Requirement";
    }
  }
}


// ==========================================
// CATEGORY BUTTONS
// ==========================================

function setupCategoryButtons() {

  const categories =
    document.querySelectorAll(
      ".category"
    );

  categories.forEach(
    category => {

      category.addEventListener(
        "click",
        () => {

          const categoryName =
            category.dataset.category ||
            category.querySelector("h3")
              ?.textContent
              ?.trim() ||
            "";

          const searchInput =
            document.getElementById(
              "searchInput"
            );

          if (searchInput) {

            searchInput.value =
              categoryName;
          }

          const hero =
            document.querySelector(
              ".hero"
            );

          if (hero) {

            hero.scrollIntoView({
              behavior: "smooth"
            });
          }

          /*
            Automatically search category
          */

          setTimeout(
            () => {
              searchRequirements();
            },
            400
          );

        }
      );
    }
  );
}


// ==========================================
// NAVIGATION
// ==========================================

function setupNavigation() {

  const postNeedButtons =
    document.querySelectorAll(
      "[data-action='post-need']"
    );

  postNeedButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          scrollToNeed();

        }
      );
    }
  );
}


// ==========================================
// AUTH SECTION
// ==========================================

function openAuth(mode) {

  const authSection =
    document.getElementById(
      "authSection"
    );

  if (!authSection) {

    if (mode === "login") {
      loginUser();
    } else {
      signUpUser();
    }

    return;
  }

  authSection.classList.remove(
    "hidden"
  );

  if (
    typeof switchAuthMode ===
    "function"
  ) {
    switchAuthMode(mode || "login");
  }

  authSection.scrollIntoView({
    behavior: "smooth"
  });
}


function switchAuthMode(mode) {

  const loginTab =
    document.getElementById(
      "loginTab"
    );

  const signupTab =
    document.getElementById(
      "signupTab"
    );

  const title =
    document.getElementById(
      "authTitle"
    );

  const description =
    document.getElementById(
      "authDescription"
    );

  const submit =
    document.getElementById(
      "authSubmit"
    );

  if (!loginTab || !signupTab) {
    return;
  }

  if (mode === "signup") {

    loginTab.classList.remove(
      "active"
    );

    signupTab.classList.add(
      "active"
    );

    if (title) {
      title.textContent =
        "Create Account";
    }

    if (description) {
      description.textContent =
        "Create your NeedFinder Global account.";
    }

    if (submit) {
      submit.textContent =
        "Create Account";
    }

  } else {

    signupTab.classList.remove(
      "active"
    );

    loginTab.classList.add(
      "active"
    );

    if (title) {
      title.textContent =
        "Login";
    }

    if (description) {
      description.textContent =
        "Login to your NeedFinder Global account.";
    }

    if (submit) {
      submit.textContent =
        "Login";
    }
  }
}


async function handleAuth(event) {

  event.preventDefault();

  const emailElement =
    document.getElementById(
      "authEmail"
    );

  const passwordElement =
    document.getElementById(
      "authPassword"
    );

  const submit =
    document.getElementById(
      "authSubmit"
    );

  if (!emailElement || !passwordElement) {
    return;
  }

  const email =
    emailElement.value.trim();

  const password =
    passwordElement.value;

  if (!email || !password) {
    showAuthMessage(
      "Please enter email and password.",
      "error"
    );
    return;
  }

  if (submit) {
    submit.disabled = true;
    submit.textContent =
      "Please wait...";
  }

  clearAuthMessage();

  try {

    const signupTab =
      document.getElementById(
        "signupTab"
      );

    const isSignup =
      signupTab &&
      signupTab.classList.contains(
        "active"
      );

    if (isSignup) {

      const { data, error } =
        await supabaseClient.auth.signUp({
          email: email,
          password: password
        });

      if (error) {
        throw error;
      }

      if (data.session) {

        currentUser =
          data.session.user;

        updateAuthUI();

        showAuthMessage(
          "Account created successfully. You are now logged in.",
          "success"
        );

      } else {

        showAuthMessage(
          "Account created. Please check your email to confirm your account.",
          "success"
        );
      }

    } else {

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

      if (error) {
        throw error;
      }

      currentUser =
        data.user || null;

      updateAuthUI();

      showAuthMessage(
        "Login successful.",
        "success"
      );

      setTimeout(
        () => {

          const authSection =
            document.getElementById(
              "authSection"
            );

          if (authSection) {
            authSection.classList.add(
              "hidden"
            );
          }

        },
        800
      );
    }

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    showAuthMessage(
      error.message ||
      "Authentication failed.",
      "error"
    );

  } finally {

    if (submit) {

      submit.disabled = false;

      const signupTab =
        document.getElementById(
          "signupTab"
        );

      const isSignup =
        signupTab &&
        signupTab.classList.contains(
          "active"
        );

      submit.textContent =
        isSignup
          ? "Create Account"
          : "Login";
    }
  }
}


function showAuthMessage(
  message,
  type
) {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) return;

  box.textContent =
    message;

  box.className =
    "auth-message " +
    type;
}


function clearAuthMessage() {

  const box =
    document.getElementById(
      "authMessage"
    );

  if (!box) return;

  box.textContent = "";

  box.className =
    "auth-message";
}


// ==========================================
// PAGE HELPERS
// ==========================================

function scrollToNeed() {

  const section =
    document.getElementById(
      "post-need"
    );

  if (section) {

    section.scrollIntoView({
      behavior: "smooth"
    });
  }
}


function focusRequirement() {

  if (!currentUser) {

    alert(
      "Please login or sign up before posting a requirement."
    );

    openAuth("login");

    return;
  }

  const section =
    document.getElementById(
      "post-need"
    );

  if (section) {

    section.scrollIntoView({
      behavior: "smooth"
    });
  }

  const title =
    document.getElementById(
      "needTitle"
    );

  if (title) {
    setTimeout(
      () => title.focus(),
      500
    );
  }
}


function chooseCategory(category) {

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  if (searchInput) {
    searchInput.value =
      category;
  }

  const hero =
    document.querySelector(
      ".hero"
    );

  if (hero) {

    hero.scrollIntoView({
      behavior: "smooth"
    });
  }

  setTimeout(
    () => searchRequirements(),
    400
  );
}


function searchNeed() {
  searchRequirements();
}


function getCurrentUser() {
  return currentUser;
}


function showMessage(message) {
  alert(message);
}


// ==========================================
// SECURITY HELPERS
// ==========================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function escapeQuery(value) {

  return String(value)
    .replace(/\\/g, "")
    .replace(/%/g, "")
    .replace(/,/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .replace(/\*/g, "")
    .replace(/\./g, "");
}


function formatDate(date) {

  if (!date) {
    return "";
  }

  try {

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "";
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );

  } catch (error) {

    return "";
  }
}
