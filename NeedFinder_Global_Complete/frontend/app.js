// NeedFinder Global - Complete frontend application

const categories = [
  ["Property","🏠"],["Clothing & Fashion","👕"],["Electronics","📱"],
  ["Vehicles","🚗"],["Remote Work","💼"],["Services","🛠️"],["Products","🛒"],
  ["Buy & Sell","📦"],["Hotels & Accommodation","🏨"],["Travel","✈️"],
  ["Education","🎓"],["Digital Services","💻"],["Delivery & Moving","🚚"],
  ["Business Services","🏢"],["Other","✨"]
];

const countries = [
  "Pakistan","United Arab Emirates","Saudi Arabia","United Kingdom","United States",
  "Canada","Australia","Germany","France","Turkey","India","Malaysia","Singapore",
  "Qatar","Kuwait","Other"
];

const demo = [
 {title:"Video Editing Laptop",cat:"Electronics",country:"Pakistan",city:"Islamabad",price:799,currency:"USD",icon:"💻",desc:"Laptop suitable for editing and creative work."},
 {title:"2 Bedroom Apartment",cat:"Property",country:"United Arab Emirates",city:"Dubai",price:4800,currency:"AED",icon:"🏠",desc:"Modern apartment listing. Contact provider for availability."},
 {title:"Men's Casual Clothing",cat:"Clothing & Fashion",country:"United Kingdom",city:"London",price:35,currency:"GBP",icon:"👕",desc:"Casual clothing collection from a local seller."},
 {title:"Remote Virtual Assistant",cat:"Remote Work",country:"United States",city:"Remote",price:15,currency:"USD",icon:"💼",desc:"Remote assistance for business administration."},
 {title:"Website Development",cat:"Digital Services",country:"Pakistan",city:"Lahore",price:250,currency:"USD",icon:"💻",desc:"Business websites and web applications."},
 {title:"Home Electrician",cat:"Services",country:"Pakistan",city:"Rawalpindi",price:20,currency:"USD",icon:"🛠️",desc:"Electrical repair and installation service."}
];

let listings = JSON.parse(localStorage.getItem("nf_listings") || "null") || demo;
let currentUser = null;
let authMode = "login";

const $ = (s) => document.querySelector(s);

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function setMessage(el, text, type="") {
  if (!el) return;
  el.textContent = text || "";
  el.className = "message " + type;
}

function fillSelect(select, values, includeAll=false) {
  if (!select) return;
  const first = includeAll ? '<option value="">All countries</option>' : "";
  select.innerHTML = first + values.map(v => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join("");
}

function initUI() {
  fillSelect($("#countrySelect"), countries, true);
  fillSelect($("#formCountry"), countries, false);
  $("#formCat").innerHTML = categories.map(x => `<option value="${escapeHTML(x[0])}">${escapeHTML(x[0])}</option>`).join("");
  $("#needCategory").innerHTML = '<option value="">Select category</option>' +
    categories.map(x => `<option value="${escapeHTML(x[0])}">${escapeHTML(x[0])}</option>`).join("");

  $("#categories").innerHTML = categories.map(x =>
    `<button class="cat" type="button" data-cat="${escapeHTML(x[0])}">
      <span class="icon">${x[1]}</span><b>${escapeHTML(x[0])}</b>
    </button>`
  ).join("");

  document.querySelectorAll(".cat").forEach(btn => {
    btn.addEventListener("click", () => {
      $("#searchInput").value = btn.dataset.cat;
      searchAll();
    });
  });

  document.querySelectorAll(".quick button").forEach(btn => {
    btn.addEventListener("click", () => {
      $("#searchInput").value = btn.dataset.q;
      searchAll();
    });
  });

  $("#searchButton").addEventListener("click", searchAll);
  $("#searchInput").addEventListener("keydown", e => { if (e.key === "Enter") searchAll(); });
  $("#sort").addEventListener("change", () => renderLocal(listings, "All listings"));

  $("#sellBtn").addEventListener("click", () => {
    if (!currentUser) {
      openAuth("login");
      setMessage($("#authMessage"), "Login or sign up before creating a listing.", "error");
      return;
    }
    $("#modal").classList.remove("hidden");
  });
  $("#close").addEventListener("click", () => $("#modal").classList.add("hidden"));
  $("#authClose").addEventListener("click", () => $("#authModal").classList.add("hidden"));
  $("#focusNeedBtn").addEventListener("click", focusRequirement);
  $("#listingForm").addEventListener("submit", publishListing);
  $("#requirementForm").addEventListener("submit", submitRequirement);

  $("#loginButton").addEventListener("click", () => openAuth("login"));
  $("#signUpButton").addEventListener("click", () => openAuth("signup"));
  $("#authLoginTab").addEventListener("click", () => setAuthMode("login"));
  $("#authSignupTab").addEventListener("click", () => setAuthMode("signup"));
  $("#authForm").addEventListener("submit", handleAuth);

  renderLocal(listings);
}

function renderLocal(items, title="Featured opportunities") {
  const sorted = [...items];
  if ($("#sort").value === "price") sorted.sort((a,b) => Number(a.price||0) - Number(b.price||0));
  $("#resultsTitle").textContent = title;
  $("#resultsSub").textContent = `${sorted.length} matching listing${sorted.length === 1 ? "" : "s"}`;
  const box = $("#results");
  if (!sorted.length) {
    box.innerHTML = '<div class="empty">No matching listings yet. Try another search or post a requirement.</div>';
    return;
  }
  box.innerHTML = sorted.map(x => `
    <article class="card">
      <div class="pic">${x.icon || "✨"}</div>
      <div class="card-body">
        <div class="tag">${escapeHTML(x.cat)}</div>
        <h3>${escapeHTML(x.title)}</h3>
        <div class="meta">📍 ${escapeHTML(x.city || "")}${x.city ? ", " : ""}${escapeHTML(x.country || "")}</div>
        <div class="meta">${escapeHTML(x.desc || "")}</div>
        <div class="price">${escapeHTML(x.currency || "USD")} ${Number(x.price || 0).toLocaleString()}</div>
      </div>
    </article>`).join("");
}

async function searchAll() {
  const q = $("#searchInput").value.trim().toLowerCase();
  const country = $("#countrySelect").value;
  const local = listings.filter(x => {
    const hay = [x.title,x.cat,x.desc,x.city,x.country].join(" ").toLowerCase();
    return (!q || hay.includes(q)) && (!country || x.country === country);
  });

  let remote = [];
  if (window.supabaseClient) {
    try {
      let query = supabaseClient.from("requirements").select("*").eq("status","open").order("created_at",{ascending:false}).limit(50);
      if (q) {
        const safe = q.replace(/[%(),*]/g,"");
        query = query.or(`title.ilike.%${safe}%,details.ilike.%${safe}%,category.ilike.%${safe}%,location.ilike.%${safe}%`);
      }
      if (country) query = query.ilike("location", `%${country}%`);
      const {data,error} = await query;
      if (!error && Array.isArray(data)) {
        remote = data.map(r => ({
          title:r.title, cat:r.category || "Other", country:r.location || "",
          city:"", price:null, currency:"", icon:(categories.find(x=>x[0]===r.category)||["","✨"])[1],
          desc:r.details || "", isRequirement:true
        }));
      }
    } catch (e) {
      console.warn("Supabase search unavailable; local results shown.", e);
    }
  }

  const combined = [...remote, ...local];
  $("#resultsTitle").textContent = q || country ? "Search results" : "Featured opportunities";
  $("#resultsSub").textContent = `${combined.length} result${combined.length===1?"":"s"}`;
  renderCombined(combined);
  $("#browse").scrollIntoView({behavior:"smooth"});
}

function renderCombined(items) {
  const box = $("#results");
  if (!items.length) {
    box.innerHTML = '<div class="empty">No matching results found. Try another search.</div>';
    return;
  }
  box.innerHTML = items.map(x => `
    <article class="card">
      <div class="pic">${x.icon || "✨"}</div>
      <div class="card-body">
        <div class="tag">${x.isRequirement ? "CUSTOMER NEED" : escapeHTML(x.cat)}</div>
        <h3>${escapeHTML(x.title)}</h3>
        <div class="meta">📍 ${escapeHTML(x.city || "")}${x.city ? ", " : ""}${escapeHTML(x.country || "Worldwide")}</div>
        <div class="meta">${escapeHTML(x.desc || "")}</div>
        ${x.isRequirement ? '<div class="requirement-label">Open requirement</div>' :
          `<div class="price">${escapeHTML(x.currency || "USD")} ${Number(x.price||0).toLocaleString()}</div>`}
      </div>
    </article>`).join("");
}

function openAuth(mode) {
  setAuthMode(mode);
  $("#authModal").classList.remove("hidden");
}

function setAuthMode(mode) {
  authMode = mode;
  const login = mode === "login";
  $("#authLoginTab").classList.toggle("active", login);
  $("#authSignupTab").classList.toggle("active", !login);
  $("#authTitle").textContent = login ? "Login" : "Create Account";
  $("#authDescription").textContent = login ? "Login to your NeedFinder Global account." : "Create your NeedFinder Global account.";
  $("#authSubmit").textContent = login ? "Login" : "Create Account";
  setMessage($("#authMessage"), "");
}

async function handleAuth(e) {
  e.preventDefault();
  if (!window.supabaseClient) {
    setMessage($("#authMessage"), "Supabase is not configured. Add your Supabase URL and anon key in config.js.", "error");
    return;
  }
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const btn = $("#authSubmit");
  btn.disabled = true;
  btn.textContent = authMode === "login" ? "Logging in..." : "Creating account...";
  try {
    const result = authMode === "login"
      ? await supabaseClient.auth.signInWithPassword({email,password})
      : await supabaseClient.auth.signUp({email,password});
    if (result.error) throw result.error;
    if (authMode === "signup" && !result.data.session) {
      setMessage($("#authMessage"), "Account created. Check your email to confirm the account, then login.", "success");
    } else {
      setMessage($("#authMessage"), "Login successful.", "success");
      setTimeout(() => $("#authModal").classList.add("hidden"), 700);
    }
  } catch (err) {
    setMessage($("#authMessage"), err.message || "Authentication failed.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = authMode === "login" ? "Login" : "Create Account";
  }
}

function updateAuthUI(user) {
  currentUser = user || null;
  const area = $("#authArea");
  if (!area) return;
  if (currentUser) {
    area.innerHTML = `
      <span class="user-email">👤 ${escapeHTML(currentUser.email || "Logged in")}</span>
      <button id="logoutButton" class="nav-btn danger" type="button">Logout</button>`;
    $("#logoutButton").addEventListener("click", logoutUser);
  } else {
    area.innerHTML = `
      <button id="loginButton" class="nav-btn light" type="button">Login</button>
      <button id="signUpButton" class="nav-btn primary" type="button">Sign Up</button>`;
    $("#loginButton").addEventListener("click", () => openAuth("login"));
    $("#signUpButton").addEventListener("click", () => openAuth("signup"));
  }
}

async function initializeAuth() {
  if (!window.supabaseClient) {
    updateAuthUI(null);
    return;
  }
  try {
    const {data,error} = await supabaseClient.auth.getSession();
    if (error) throw error;
    updateAuthUI(data.session ? data.session.user : null);
    supabaseClient.auth.onAuthStateChange((_event,session) => updateAuthUI(session ? session.user : null));
  } catch (e) {
    console.warn("Auth initialization failed.", e);
    updateAuthUI(null);
  }
}

async function logoutUser() {
  if (!window.supabaseClient) return;
  const {error} = await supabaseClient.auth.signOut();
  if (error) {
    alert("Logout error: " + error.message);
    return;
  }
  updateAuthUI(null);
}

async function submitRequirement(e) {
  e.preventDefault();
  if (!currentUser) {
    openAuth("login");
    setMessage($("#authMessage"), "Please login or sign up before posting a requirement.", "error");
    return;
  }
  if (!window.supabaseClient) {
    setMessage($("#requirementMessage"), "Supabase is not configured. The requirement cannot be saved online yet.", "error");
    return;
  }

  const payload = {
    user_id: currentUser.id,
    title: $("#needTitle").value.trim(),
    category: $("#needCategory").value,
    location: $("#needLocation").value.trim(),
    details: $("#needDetails").value.trim(),
    status: "open"
  };
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.textContent = "Submitting...";
  try {
    const {data,error} = await supabaseClient.from("requirements").insert(payload).select().single();
    if (error) throw error;
    setMessage($("#requirementMessage"), `Requirement submitted successfully. Reference ID: ${data.id}`, "success");
    e.target.reset();
    await searchAll();
  } catch (err) {
    setMessage($("#requirementMessage"), err.message || "Requirement could not be submitted.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Submit Requirement";
  }
}

function focusRequirement() {
  $("#post-need").scrollIntoView({behavior:"smooth"});
  setTimeout(() => $("#needTitle").focus(), 400);
}

function publishListing(e) {
  e.preventDefault();
  if (!currentUser) {
    openAuth("login");
    return;
  }
  const f = new FormData(e.target);
  const item = {
    title:f.get("title"), cat:f.get("category"), country:f.get("country"),
    city:f.get("city"), price:Number(f.get("price")), currency:f.get("currency")||"USD",
    desc:f.get("description"), contact:f.get("contact"),
    icon:(categories.find(x=>x[0]===f.get("category"))||["","✨"])[1]
  };
  listings.unshift(item);
  localStorage.setItem("nf_listings", JSON.stringify(listings));
  e.target.reset();
  $("#modal").classList.add("hidden");
  renderLocal(listings, "Your marketplace listings");
}

document.addEventListener("DOMContentLoaded", async () => {
  initUI();
  await initializeAuth();
});
