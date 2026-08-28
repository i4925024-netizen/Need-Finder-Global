// ==========================================
// NeedFinder Global - Application Logic
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  setupApplication();
});

function setupApplication() {
  setupSearch();
  setupRequirementForm();
  setupCategoryButtons();
  setupNavigation();
}


// ==========================================
// SEARCH
// ==========================================

function setupSearch() {
  const searchButton = document.getElementById("searchButton");

  if (!searchButton) return;

  searchButton.addEventListener("click", searchRequirements);
}

async function searchRequirements() {
  const searchInput =
    document.getElementById("searchInput");

  const countrySelect =
    document.getElementById("countrySelect");

  const results =
    document.getElementById("searchResults");

  const search =
    searchInput ? searchInput.value.trim() : "";

  const country =
    countrySelect ? countrySelect.value : "";

  if (!search && !country) {
    alert("Please enter a need or select a country.");
    return;
  }

  if (results) {
    results.innerHTML =
      "<p>Searching...</p>";
  }

  try {
    let query = supabaseClient
      .from("requirements")
      .select("*")
      .eq("status", "open")
      .order("created_at", {
        ascending: false
      });

    if (search) {
      query = query.or(
        `title.ilike.%${escapeQuery(search)}%,details.ilike.%${escapeQuery(search)}%`
      );
    }

    if (country) {
      query = query.ilike(
        "location",
        `%${escapeQuery(country)}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    displaySearchResults(data || []);

  } catch (error) {

    console.error(error);

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

function displaySearchResults(requirements) {

  const results =
    document.getElementById("searchResults");

  if (!results) return;

  if (!requirements.length) {

    results.innerHTML = `
      <div class="no-results">
        <h3>No requirements found</h3>
        <p>
          Try another search or post your own requirement.
        </p>
      </div>
    `;

    return;
  }

  results.innerHTML = requirements
    .map(requirement => {

      return `
        <div class="requirement-card">

          <div class="requirement-card-top">

            <span class="requirement-category">
              ${escapeHTML(requirement.category)}
            </span>

            <span class="requirement-status">
              ${escapeHTML(requirement.status)}
            </span>

          </div>

          <h3>
            ${escapeHTML(requirement.title)}
          </h3>

          <p>
            ${escapeHTML(requirement.details)}
          </p>

          <div class="requirement-location">
            📍 ${escapeHTML(requirement.location)}
          </div>

          <small>
            Posted:
            ${formatDate(requirement.created_at)}
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
    document.getElementById("requirementForm");

  if (!form) return;

  form.addEventListener(
    "submit",
    submitRequirement
  );
}


async function submitRequirement(event) {

  event.preventDefault();

  const title =
    document
      .getElementById("needTitle")
      .value
      .trim();

  const category =
    document
      .getElementById("needCategory")
      .value;

  const location =
    document
      .getElementById("needLocation")
      .value
      .trim();

  const details =
    document
      .getElementById("needDetails")
      .value
      .trim();

  if (!title || !category || !location || !details) {

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

    const { data, error } =
      await supabaseClient
        .from("requirements")
        .insert({
          title: title,
          category: category,
          location: location,
          details: details,
          status: "open"
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

    // Refresh search results if visible
    if (
      document.getElementById(
        "searchResults"
      )
    ) {
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

  categories.forEach(category => {

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

  });
}


// ==========================================
// NAVIGATION
// ==========================================

function setupNavigation() {

  const postNeedButtons =
    document.querySelectorAll(
      "[data-action='post-need']"
    );

  postNeedButtons.forEach(button => {

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

  });
}


// ==========================================
// SECURITY HELPERS
// ==========================================

function escapeHTML(value) {

  if (value === null ||
      value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeQuery(value) {

  return String(value)
    .replaceAll("%", "")
    .replaceAll(",", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replaceAll("*", "");
}


function formatDate(date) {

  if (!date) return "";

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
