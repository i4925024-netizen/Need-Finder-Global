```javascript
// ==========================================
// NeedFinder Global - Application Logic
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
  setupAuth();
  initializeAuth();
}


// ==========================================
// AUTHENTICATION
// ==========================================

function setupAuth() {

  const signUpButton =
    document.getElementById("signUpButton");

  const loginButton =
    document.getElementById("loginButton");

  const logoutButton =
    document.getElementById("logoutButton");

  if (signUpButton) {
    signUpButton.addEventListener(
      "click",
      signUpUser
    );
  }

  if (loginButton) {
    loginButton.addEventListener(
      "click",
      loginUser
    );
  }

  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      logoutUser
    );
  }
}


async function initializeAuth() {

  try {

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    currentUser =
      data.session?.user || null;

    updateAuthUI();

    supabaseClient.auth.onAuthStateChange(
      (_event, session) => {

        currentUser =
          session?.user || null;

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
// SIGN UP
// ==========================================

async function signUpUser() {

  const email =
    prompt("Enter your email address:");

  if (!email) {
    return;
  }

  const password =
    prompt(
      "Create a password (minimum 6 characters):"
    );

  if (!password) {
    return;
  }

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

    if (error) {
      throw error;
    }

    currentUser =
      data.user || null;

    alert(
      "✅ Account created successfully!\n\n" +
      "Email: " +
      email.trim()
    );

    updateAuthUI();

  } catch (error) {

    console.error(
      "Sign up error:",
      error
    );

    alert(
      "❌ Sign Up failed:\n\n" +
      error.message
    );

  }
}


// ==========================================
// LOGIN
// ==========================================

async function loginUser() {

  const email =
    prompt("Enter your email address:");

  if (!email) {
    return;
  }

  const password =
    prompt("Enter your password:");

  if (!password) {
    return;
  }

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

    if (error) {
      throw error;
    }

    currentUser =
      data.user || null;

    alert(
      "✅ Login successful!"
    );

    updateAuthUI();

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    alert(
      "❌ Login failed:\n\n" +
      error.message
    );

  }
}


// ==========================================
// LOGOUT
// ==========================================

async function logoutUser() {

  try {

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    currentUser = null;

    alert(
      "✅ Logged out successfully."
    );

    updateAuthUI();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    alert(
      "❌ Logout failed:\n\n" +
      error.message
    );

  }
}


// ==========================================
// UPDATE AUTH UI
// ==========================================

function updateAuthUI() {

  const authArea =
    document.getElementById("authArea");

  if (!authArea) {
    return;
  }

  if (currentUser) {

    authArea.innerHTML = `
      <div class="auth-user">
        <span>
          👤 ${escapeHTML(
            currentUser.email || ""
          )}
        </span>

        <button
          type="button"
          id="logoutButton">
          Logout
        </button>
      </div>
    `;

    const logoutButton =
      document.getElementById(
        "logoutButton"
      );

    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        logoutUser
      );

    }

  } else {

    authArea.innerHTML = `
      <button
        type="button"
        id="loginButton">
        Login
      </button>

      <button
        type="button"
        id="signUpButton">
        Sign Up
      </button>
    `;

    const loginButton =
      document.getElementById(
        "loginButton"
      );

    const signUpButton =
      document.getElementById(
        "signUpButton"
      );

    if (loginButton) {

      loginButton.addEventListener(
        "click",
        loginUser
      );

    }

    if (signUpButton) {

      signUpButton.addEventListener(
        "click",
        signUpUser
      );

    }

  }
}


// ==========================================
// SEARCH
// ==========================================

function setupSearch() {

  const searchButton =
    document.getElementById(
      "searchButton"
    );

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
    document.getElementById(
      "searchInput"
    );

  const countrySelect =
    document.getElementById(
      "countrySelect"
    );

  const results =
    document.getElementById(
      "searchResults"
    );

  const search =
    searchInput
      ? searchInput.value.trim()
      : "";

  const country =
    countrySelect
      ? countrySelect.value
      : "";

  if (!search && !country) {

    alert(
      "Please enter a need or select a country."
    );

    return;
  }

  if (results) {

    results.innerHTML =
      "<p>Searching...</p>";

  }

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
        );

    if (search) {

      const safeSearch =
        escapeQuery(search);

      query =
        query.or(
          `title.ilike.%${safeSearch}%,details.ilike.%${safeSearch}%`
        );

    }

    if (country) {

      const safeCountry =
        escapeQuery(country);

      query =
        query.ilike(
          "location",
          `%${safeCountry}%`
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

    if (results) {

      results.innerHTML =
        "<p>Search failed. Please try again.</p>";

    }

    alert(
      "Search error:\n\n" +
      error.message
    );

  }
}


// ==========================================
// DISPLAY SEARCH RESULTS
// ==========================================

function displaySearchResults(
  requirements
) {

  const results =
    document.getElementById(
      "searchResults"
    );

  if (!results) {
    return;
  }

  if (!requirements.length) {

    results.innerHTML = `
      <div class="no-results">

        <h3>
          No requirements found
        </h3>

        <p>
          Try another search or post
          your own requirement.
        </p>

      </div>
    `;

    return;
  }

  results.innerHTML =
    requirements
      .map(requirement => {

        return `
          <div class="requirement-card">

            <div class="requirement-card-top">

              <span class="requirement-category">
                ${escapeHTML(
                  requirement.category
                )}
              </span>

              <span class="requirement-status">
                ${escapeHTML(
                  requirement.status
                )}
              </span>

            </div>

            <h3>
              ${escapeHTML(
                requirement.title
              )}
            </h3>

            <p>
              ${escapeHTML(
                requirement.details
              )}
            </p>

            <div class="requirement-location">
              📍 ${escapeHTML(
                requirement.location
              )}
            </div>

            <small>
              Posted:
              ${formatDate(
                requirement.created_at
              )}
            </small>

          </div>
        `;

      })
      .join("");
}


// ==========================================
// REQUIREMENT FORM
// ==========================================

function setupRequirementForm() {

  const form =
    document.getElementById(
      "requirementForm"
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

  // Login required
  if (!currentUser) {

    alert(
      "🔐 Please Login or Sign Up before posting a requirement."
    );

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
    categoryElement.value;

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

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Submitting...";

  }

  try {

    const { data, error } =
      await supabaseClient
        .from("requirements")
        .insert({

          user_id:
            currentUser.id,

          title:
            title,

          category:
            category,

          location:
            location,

          details:
            details,

          status:
            "open"

        })
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

      searchRequirements();

    }

  } catch (error) {

    console.error(
      "Supabase error:",
      error
    );

    alert(
      "❌ Requirement could not be submitted.\n\n" +
      error.message
    );

  } finally {

    if (submitButton) {

      submitButton.disabled =
        false;

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
            category
              .querySelector("h3")
              ?.textContent ||
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
      );

    }
  );
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

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeQuery(value) {

  return String(value)

    .replaceAll(
      "%",
      ""
    )

    .replaceAll(
      ",",
      ""
    )

    .replaceAll(
      "(",
      ""
    )

    .replaceAll(
      ")",
      ""
    )

    .replaceAll(
      "*",
      ""
    );
}


function formatDate(date) {

  if (!date) {
    return "";
  }

  try {

    return new Date(date)
      .toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
      );

  } catch {

    return "";

  }
}
```
