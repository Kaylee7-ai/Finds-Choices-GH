import { supabase } from "./supabase-client.js";

const $ = (id) => document.getElementById(id);
const statusBox = $("status");
const loginForm = $("loginForm");
const signupForm = $("signupForm");
const resetForm = $("resetForm");
const signedInBox = $("signedIn");
const requestedNext = new URLSearchParams(window.location.search).get("next");
const safeNext = requestedNext === "admin.html" ? "admin.html" : null;

function showStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = "status show" + (isError ? " error" : "");
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

function showTab(tab) {
  const login = tab === "login";
  loginForm.classList.toggle("hidden", !login);
  signupForm.classList.toggle("hidden", login);
  $("authTabs").classList.remove("hidden");
  $("loginTab").setAttribute("aria-selected", String(login));
  $("signupTab").setAttribute("aria-selected", String(!login));
  resetForm.classList.add("hidden");
  clearStatus();
}

$("loginTab").addEventListener("click", () => showTab("login"));
$("signupTab").addEventListener("click", () => showTab("signup"));

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  await refreshAccount();
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearStatus();

  const email = $("signupEmail").value.trim();
  const password = $("signupPassword").value;
  const displayName = $("displayName").value.trim();
  const redirectTo = new URL("auth.html", window.location.href).href;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: redirectTo
    }
  });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  if (data.session) {
    await refreshAccount();
  } else {
    showStatus("Account created. Check your email for the confirmation link before signing in.");
  }
});

$("forgotButton").addEventListener("click", async () => {
  const email = $("loginEmail").value.trim();

  if (!email) {
    showStatus("Enter your email address first.", true);
    return;
  }

  const redirectTo = new URL("auth.html?mode=reset", window.location.href).href;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  showStatus("If an account exists for that address, a password-reset email will be sent.");
});

resetForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = $("newPassword").value;
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  resetForm.classList.add("hidden");
  showTab("login");
  showStatus("Password updated. You can now sign in.");
});

$("signOutButton").addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    showStatus(error.message, true);
    return;
  }

  window.location.reload();
});

async function refreshAccount() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    showStatus(error.message, true);
    return;
  }

  if (!session) return;

  loginForm.classList.add("hidden");
  signupForm.classList.add("hidden");
  $("authTabs").classList.add("hidden");
  resetForm.classList.add("hidden");
  signedInBox.classList.remove("hidden");
  $("signedInText").textContent = `Signed in as ${session.user.email}.`;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    showStatus("Your account is signed in, but its profile could not be loaded. Please refresh.", true);
    return;
  }

  const isAdmin = profile?.role === "admin";
  $("adminLink").classList.toggle("hidden", !isAdmin);

  if (isAdmin && safeNext === "admin.html") {
    window.location.replace("admin.html");
  }
}

supabase.auth.onAuthStateChange(() => {
  // Defer follow-up work until the auth event callback has returned.
  queueMicrotask(() => refreshAccount());
});

if (new URLSearchParams(window.location.search).get("mode") === "reset") {
  $("authTabs").classList.add("hidden");
  loginForm.classList.add("hidden");
  signupForm.classList.add("hidden");
  resetForm.classList.remove("hidden");
}

refreshAccount();
