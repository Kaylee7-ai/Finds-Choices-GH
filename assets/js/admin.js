import { supabase } from "./supabase-client.js";

const message = document.getElementById("message");
const content = document.getElementById("adminContent");
const deniedActions = document.getElementById("deniedActions");

function showDenied(text) {
  message.textContent = text;
  deniedActions.classList.remove("hidden");
}
async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "auth.html";
}
document.getElementById("adminSignOut").addEventListener("click", signOut);
document.getElementById("deniedSignOut").addEventListener("click", signOut);

async function verifyAdmin() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return showDenied("We could not verify your session. Please sign in again.");
  if (!session) {
    showDenied("Please sign in before opening the admin dashboard.");
    return;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) return showDenied("Your account permissions could not be checked. Contact the site administrator.");
  if (profile?.role !== "admin") {
    showDenied("Access denied. This account does not have administrator permissions.");
    return;
  }

  message.textContent = `Administrator access verified for ${session.user.email}.`;
  content.classList.remove("hidden");
}
verifyAdmin();
