import { supabase } from "./supabase-client.js";

const $ = (id) => document.getElementById(id);
const message = $("message");
const contentPanel = $("adminContent");
const denied = $("deniedActions");
const formStatus = $("formStatus");
const list = $("productList");
let products = [];

function showStatus(text, isError = false) {
  formStatus.textContent = text;
  formStatus.classList.remove("hidden");
  formStatus.style.background = isError ? "#fff0ed" : "#edf4ee";
}

function clearForm() {
  $("productForm").reset();
  $("productId").value = "";
  $("saveButton").textContent = "Save product";
  formStatus.classList.add("hidden");
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.replace("auth.html");
}

$("adminSignOut").addEventListener("click", signOut);
$("clearButton").addEventListener("click", clearForm);

function safeExternalUrl(value, required = false) {
  if (!value && !required) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid https:// URL.");
  }
  if (url.protocol !== "https:") {
    throw new Error("Only secure https:// links are accepted.");
  }
  return url.href;
}

function fillForm(product) {
  $("productId").value = product.id;
  $("name").value = product.name;
  $("description").value = product.description || "";
  $("category").value = product.category;
  $("retailer").value = product.retailer || "";
  $("productType").value = product.product_type;
  $("price").value = product.price ?? "";
  $("comparePrice").value = product.compare_at_price ?? "";
  $("imageUrl").value = product.image_url || "";
  $("productUrl").value = product.product_url;
  $("status").value = product.status;
  $("saveButton").textContent = "Update product";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showStatus(error.message, true);
    return;
  }

  products = data || [];
  list.replaceChildren();

  if (!products.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No products yet. Add your first product above.";
    list.append(empty);
    return;
  }

  for (const product of products) {
    const row = document.createElement("article");
    row.className = "item";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;

    const meta = document.createElement("small");
    meta.textContent = product.category + " · " + product.retailer + " · " + product.status;
    info.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "secondary";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => fillForm(product));
    actions.append(edit);

    if (product.status !== "archived") {
      const archive = document.createElement("button");
      archive.type = "button";
      archive.className = "danger";
      archive.textContent = "Archive";
      archive.addEventListener("click", async () => {
        if (!confirm("Archive this product? It will disappear from the public catalogue.")) return;

        const { error: updateError } = await supabase
          .from("products")
          .update({ status: "archived" })
          .eq("id", product.id);

        if (updateError) {
          showStatus(updateError.message, true);
          return;
        }

        showStatus("Product archived.");
        await loadProducts();
      });
      actions.append(archive);
    }

    row.append(info, actions);
    list.append(row);
  }
}

$("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const product = {
      name: $("name").value.trim(),
      description: $("description").value.trim(),
      category: $("category").value.trim(),
      retailer: $("retailer").value.trim(),
      product_type: $("productType").value,
      price: $("price").value === "" ? null : Number($("price").value),
      compare_at_price: $("comparePrice").value === "" ? null : Number($("comparePrice").value),
      image_url: safeExternalUrl($("imageUrl").value.trim()),
      product_url: safeExternalUrl($("productUrl").value.trim(), true),
      status: $("status").value,
      currency: "GHS"
    };

    if (!product.name || !product.category) {
      throw new Error("Product name and category are required.");
    }

    const productId = $("productId").value;
    const request = productId
      ? supabase.from("products").update(product).eq("id", productId)
      : supabase.from("products").insert(product);

    const { error } = await request;
    if (error) throw error;

    showStatus(productId ? "Product updated." : "Product saved.");
    clearForm();
    await loadProducts();
  } catch (error) {
    showStatus(error.message || "Could not save product.", true);
  }
});

async function verifyAdmin() {
  // getUser() verifies the access token with Supabase before revealing the admin UI.
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    window.location.replace("auth.html?next=admin.html");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    message.textContent = "Access denied. This account does not have administrator permissions.";
    denied.classList.remove("hidden");
    $("adminSignOut").classList.remove("hidden");
    return;
  }

  message.textContent = "Administrator access verified for " + user.email + ".";
  contentPanel.classList.remove("hidden");
  $("catalogPanel").classList.remove("hidden");
  await loadProducts();
}

verifyAdmin();
