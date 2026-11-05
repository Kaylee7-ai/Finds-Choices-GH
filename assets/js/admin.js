import { supabase } from "./supabase-client.js";
const $ = (id) => document.getElementById(id);
const message = $("message"), content = $("adminContent"), denied = $("deniedActions");
const formStatus = $("formStatus"), list = $("productList");
let products = [];
function status(message, error=false){formStatus.textContent=message;formStatus.classList.remove("hidden");formStatus.style.background=error?"#fff0ed":"#edf4ee";}
function clearForm(){ $("productForm").reset(); $("productId").value=""; $("saveButton").textContent="Save product"; formStatus.classList.add("hidden"); }
async function signOut(){await supabase.auth.signOut();window.location.href="auth.html";}
$("adminSignOut").addEventListener("click",signOut);
$("clearButton").addEventListener("click",clearForm);
function safeExternalUrl(value, required=false){if(!value && !required)return "";let u;try{u=new URL(value);}catch{throw new Error("Enter a valid https:// URL.");}if(u.protocol!=="https:")throw new Error("Only secure https:// links are accepted.");return u.href;}
function fillForm(p){$("productId").value=p.id;$("name").value=p.name;$("description").value=p.description||"";$("category").value=p.category;$("retailer").value=p.retailer||"";$("productType").value=p.product_type;$("price").value=p.price??"";$("comparePrice").value=p.compare_at_price??"";$("imageUrl").value=p.image_url||"";$("productUrl").value=p.product_url;$("status").value=p.status;$("saveButton").textContent="Update product";window.scrollTo({top:0,behavior:"smooth"});}
async function loadProducts(){const {data,error}=await supabase.from("products").select("*").order("created_at",{ascending:false});if(error){status(error.message,true);return;}products=data||[];list.replaceChildren();if(!products.length){const p=document.createElement("p");p.className="muted";p.textContent="No products yet. Add your first product above.";list.append(p);return;}
for(const product of products){const row=document.createElement("article");row.className="item";const info=document.createElement("div");const name=document.createElement("strong");name.textContent=product.name;const meta=document.createElement("small");meta.textContent=product.category+" · "+product.retailer+" · "+product.status;info.append(name,meta);const actions=document.createElement("div");actions.className="item-actions";const edit=document.createElement("button");edit.type="button";edit.className="secondary";edit.textContent="Edit";edit.addEventListener("click",()=>fillForm(product));actions.append(edit);
if(product.status!=="archived"){const archive=document.createElement("button");archive.type="button";archive.className="danger";archive.textContent="Archive";archive.addEventListener("click",async()=>{if(!confirm("Archive this product? It will disappear from the public catalogue."))return;const {error}=await supabase.from("products").update({status:"archived"}).eq("id",product.id);if(error){status(error.message,true);return;}status("Product archived.");await loadProducts();});actions.append(archive);}
row.append(info,actions);list.append(row);}
}
$("productForm").addEventListener("submit",async(event)=>{event.preventDefault();try{
const product={name:$("name").value.trim(),description:$("description").value.trim(),category:$("category").value.trim(),retailer:$("retailer").value.trim(),product_type:$("productType").value,price:$("price").value===""?null:Number($("price").value),compare_at_price:$("comparePrice").value===""?null:Number($("comparePrice").value),image_url:safeExternalUrl($("imageUrl").value.trim()),product_url:safeExternalUrl($("productUrl").value.trim(),true),status:$("status").value,currency:"GHS"};
if(!product.name||!product.category)throw new Error("Product name and category are required.");
const id=$("productId").value;const query=id?supabase.from("products").update(product).eq("id",id):supabase.from("products").insert(product);
const {error}=await query;if(error)throw error;status(id?"Product updated.":"Product saved.");clearForm();await loadProducts();
}catch(error){status(error.message||"Could not save product.",true);}});
async function verifyAdmin(){const {data:{session},error:sessionError}=await supabase.auth.getSession();if(sessionError||!session){message.textContent="Please sign in with the administrator account.";denied.classList.remove("hidden");$("adminSignOut").classList.add("hidden");return;}
const {data:profile,error}=await supabase.from("profiles").select("role").eq("id",session.user.id).maybeSingle();if(error||profile?.role!=="admin"){message.textContent="Access denied. This account does not have administrator permissions.";denied.classList.remove("hidden");return;}
message.textContent="Administrator access verified for "+session.user.email+".";content.classList.remove("hidden");$("catalogPanel").classList.remove("hidden");await loadProducts();}
verifyAdmin();
