import { supabase } from "./supabase-client.js";
const $ = (id) => document.getElementById(id);
const message = $("message"), content = $("adminContent"), denied = $("deniedActions");
const formStatus = $("formStatus"), list = $("productList");
let products = [], csvRows = [], previewObjectUrl = null;
const IMAGE_BUCKET = "product-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_CSV_ROWS = 500;
const imageTypes = ["image/jpeg","image/png","image/webp","image/avif","image/gif"];

function status(message, error=false){formStatus.textContent=message;formStatus.classList.remove("hidden");formStatus.style.background=error?"#fff0ed":"#edf4ee";}
function csvStatus(message,error=false){$("csvStatus").textContent=message;$("csvStatus").classList.remove("hidden");$("csvStatus").style.background=error?"#fff0ed":"#edf4ee";}
function safeExternalUrl(value, required=false){
  if(!value && !required)return "";
  let u;try{u=new URL(value);}catch{throw new Error("Enter a valid https:// URL.");}
  if(u.protocol!=="https:")throw new Error("Only secure https:// links are accepted.");
  return u.href;
}
function clearPreview(){if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl=null;}$("imagePreview").removeAttribute("src");$("imagePreview").classList.add("hidden");}
function clearForm(){
  $("productForm").reset();$("productId").value="";$("saveButton").textContent="Save product";
  clearPreview();formStatus.classList.add("hidden");
}
async function signOut(){await supabase.auth.signOut();window.location.href="auth.html";}
$("adminSignOut").addEventListener("click",signOut);
$("clearButton").addEventListener("click",clearForm);
$("imageFile").addEventListener("change",()=>{
  clearPreview();const file=$("imageFile").files?.[0];if(!file)return;
  if(!imageTypes.includes(file.type)||file.size>MAX_IMAGE_BYTES){status("Choose a supported image under 5 MB.",true);$("imageFile").value="";return;}
  previewObjectUrl=URL.createObjectURL(file);$("imagePreview").src=previewObjectUrl;$("imagePreview").classList.remove("hidden");
});
function fillForm(p){
  clearPreview();$("imageFile").value="";$("productId").value=p.id;$("name").value=p.name;
  $("description").value=p.description||"";$("category").value=p.category;$("retailer").value=p.retailer||"";
  $("productType").value=p.product_type;$("price").value=p.price??"";$("comparePrice").value=p.compare_at_price??"";
  $("imageUrl").value=p.image_url||"";$("productUrl").value=p.product_url;$("status").value=p.status;
  $("saveButton").textContent="Update product";window.scrollTo({top:0,behavior:"smooth"});
}
async function uploadProductImage(file){
  if(!imageTypes.includes(file.type))throw new Error("Unsupported image type. Use JPG, PNG, WebP, AVIF or GIF.");
  if(file.size>MAX_IMAGE_BYTES)throw new Error("Image is larger than 5 MB. Choose a smaller photo.");
  const ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif","image/gif":"gif" })[file.type];
  const path="products/"+crypto.randomUUID()+"."+ext;
  const {error}=await supabase.storage.from(IMAGE_BUCKET).upload(path,file,{cacheControl:"31536000",contentType:file.type,upsert:false});
  if(error)throw error;
  const {data}=supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
async function loadProducts(){
  const {data,error}=await supabase.from("products").select("*").order("created_at",{ascending:false});
  if(error){status(error.message,true);return;}products=data||[];list.replaceChildren();
  if(!products.length){const p=document.createElement("p");p.className="muted";p.textContent="No products yet. Add your first product above.";list.append(p);return;}
  for(const product of products){
    const row=document.createElement("article");row.className="item";const info=document.createElement("div");
    const name=document.createElement("strong");name.textContent=product.name;
    const meta=document.createElement("small");meta.textContent=product.category+" · "+(product.retailer||"No retailer")+" · "+product.status;
    info.append(name,meta);const actions=document.createElement("div");actions.className="item-actions";
    const edit=document.createElement("button");edit.type="button";edit.className="secondary";edit.textContent="Edit";edit.addEventListener("click",()=>fillForm(product));actions.append(edit);
    if(product.status!=="archived"){const archive=document.createElement("button");archive.type="button";archive.className="danger";archive.textContent="Archive";
      archive.addEventListener("click",async()=>{if(!confirm("Archive this product? It will disappear from the public catalogue."))return;
        const {error}=await supabase.from("products").update({status:"archived"}).eq("id",product.id);
        if(error){status(error.message,true);return;}status("Product archived.");await loadProducts();});actions.append(archive);}
    row.append(info,actions);list.append(row);
  }
}
$("productForm").addEventListener("submit",async(event)=>{
  event.preventDefault();const save=$("saveButton");save.disabled=true;
  try{
    let imageUrl=safeExternalUrl($("imageUrl").value.trim());
    const file=$("imageFile").files?.[0];if(file){status("Uploading product photo…");imageUrl=await uploadProductImage(file);}
    const product={
      name:$("name").value.trim(),description:$("description").value.trim(),category:$("category").value.trim(),
      retailer:$("retailer").value.trim(),product_type:$("productType").value,
      price:$("price").value===""?null:Number($("price").value),
      compare_at_price:$("comparePrice").value===""?null:Number($("comparePrice").value),
      image_url:imageUrl,product_url:safeExternalUrl($("productUrl").value.trim(),true),
      status:$("status").value,currency:"GHS"
    };
    if(!product.name||!product.category)throw new Error("Product name and category are required.");
    if(product.price!==null&&(!Number.isFinite(product.price)||product.price<0))throw new Error("Enter a valid non-negative price.");
    if(product.compare_at_price!==null&&(!Number.isFinite(product.compare_at_price)||product.compare_at_price<0))throw new Error("Enter a valid previous price.");
    const id=$("productId").value;
    const query=id?supabase.from("products").update(product).eq("id",id):supabase.from("products").insert(product);
    const {error}=await query;if(error)throw error;
    status(id?"Product updated.":"Product saved.");clearForm();await loadProducts();
  }catch(error){status(error.message||"Could not save product.",true);}
  finally{save.disabled=false;}
});

// RFC-4180-style CSV parser: supports quoted fields, commas and escaped quotes.
function parseCsv(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"'){quoted=false;}else{field+=c;}}
    else if(c==='"'){if(field.length)throw new Error("Unexpected quote in CSV. Check the file formatting.");quoted=true;}
    else if(c===","){row.push(field);field="";}
    else if(c==="\n"){row.push(field);rows.push(row);row=[];field="";}
    else if(c==="\r"){if(text[i+1]==="\n")continue;row.push(field);rows.push(row);row=[];field="";}
    else{field+=c;}
  }
  if(quoted)throw new Error("Your CSV has an unclosed quoted field.");
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows.filter(r=>r.some(v=>String(v).trim()!==""));
}
function csvToProducts(text){
  const parsed=parseCsv(text.replace(/^\uFEFF/,""));
  if(parsed.length<2)throw new Error("The CSV needs a header row and at least one product.");
  const headers=parsed[0].map(h=>h.trim().toLowerCase());
  const required=["name","category","product_url"];
  for(const key of required)if(!headers.includes(key))throw new Error("Missing required CSV column: "+key);
  const records=parsed.slice(1);
  if(records.length>MAX_CSV_ROWS)throw new Error("Import limit is 500 products per file.");
  return records.map((values,index)=>{
    const raw={};headers.forEach((h,i)=>raw[h]=(values[i]??"").trim());
    const name=raw.name||"",category=raw.category||"",productUrl=raw.product_url||"";
    if(!name||!category)throw new Error("CSV row "+(index+2)+": product name and category are required.");
    if(name.length>140||category.length>60)throw new Error("CSV row "+(index+2)+": name or category is too long.");
    const type=raw.product_type||"affiliate",state=raw.status||"draft";
    if(!["affiliate","resold","digital"].includes(type))throw new Error("CSV row "+(index+2)+": product_type must be affiliate, resold or digital.");
    if(!["draft","active","archived"].includes(state))throw new Error("CSV row "+(index+2)+": status must be draft, active or archived.");
    const price=raw.price===""?null:Number(raw.price),compare=raw.compare_at_price===""?null:Number(raw.compare_at_price);
    if(price!==null&&(!Number.isFinite(price)||price<0))throw new Error("CSV row "+(index+2)+": invalid price.");
    if(compare!==null&&(!Number.isFinite(compare)||compare<0))throw new Error("CSV row "+(index+2)+": invalid previous price.");
    let imageUrl="";try{imageUrl=safeExternalUrl(raw.image_url||"");safeExternalUrl(productUrl,true);}catch(e){throw new Error("CSV row "+(index+2)+": "+e.message);}
    return {name,category,retailer:(raw.retailer||"").slice(0,80),product_type:type,price,compare_at_price:compare,
      image_url:imageUrl,product_url:safeExternalUrl(productUrl,true),description:(raw.description||"").slice(0,1200),
      status:state,currency:"GHS"};
  });
}
function renderCsvPreview(rows){
  const host=$("csvPreview");host.replaceChildren();
  const summary=document.createElement("p");summary.className="muted";summary.textContent="Previewing "+rows.length+" products. First 8 shown:";host.append(summary);
  const table=document.createElement("div");table.style.overflowX="auto";
  const t=document.createElement("table");t.style.width="100%";t.style.borderCollapse="collapse";
  const head=document.createElement("tr");["Product","Category","Price","Status"].forEach(label=>{const th=document.createElement("th");th.textContent=label;th.style.textAlign="left";th.style.padding="7px";head.append(th);});t.append(head);
  rows.slice(0,8).forEach(p=>{const tr=document.createElement("tr");[p.name,p.category,p.price===null?"Not set":"GH₵ "+p.price,p.status].forEach(value=>{const td=document.createElement("td");td.textContent=String(value);td.style.padding="7px";td.style.borderTop="1px solid #e1e8e0";tr.append(td);});t.append(tr);});
  table.append(t);host.append(table);
}
$("downloadCsvTemplate").addEventListener("click",()=>{
  const csv="name,category,retailer,product_type,price,compare_at_price,image_url,product_url,description,status\r\n";
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="finds-choices-products-template.csv";a.click();URL.revokeObjectURL(url);
});
$("csvFile").addEventListener("change",async()=>{
  csvRows=[];$("importCsvButton").disabled=true;$("csvPreview").replaceChildren();
  const file=$("csvFile").files?.[0];if(!file)return;
  try{
    if(file.size>MAX_CSV_BYTES)throw new Error("CSV file is larger than 2 MB.");
    const text=await file.text();csvRows=csvToProducts(text);renderCsvPreview(csvRows);
    csvStatus(csvRows.length+" products validated and ready to import.");$("importCsvButton").disabled=false;
  }catch(error){csvStatus(error.message||"Could not read this CSV.",true);}
});
$("importCsvButton").addEventListener("click",async()=>{
  if(!csvRows.length)return;const button=$("importCsvButton");button.disabled=true;let inserted=0;
  try{
    for(let i=0;i<csvRows.length;i+=50){
      const batch=csvRows.slice(i,i+50);const {error}=await supabase.from("products").insert(batch);
      if(error)throw new Error("Imported "+inserted+" products before an error: "+error.message);
      inserted+=batch.length;csvStatus("Imported "+inserted+" of "+csvRows.length+" products…");
    }
    csvStatus("Successfully imported "+inserted+" products. They are now in your catalogue.");
    csvRows=[];$("csvFile").value="";$("csvPreview").replaceChildren();await loadProducts();
  }catch(error){csvStatus(error.message||"Import failed.",true);await loadProducts();}
  finally{button.disabled=true;}
});

async function verifyAdmin(){
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError||!session){message.textContent="Please sign in with the administrator account.";denied.classList.remove("hidden");$("adminSignOut").classList.add("hidden");return;}
  const {data:profile,error}=await supabase.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
  if(error||profile?.role!=="admin"){message.textContent="Access denied. This account does not have administrator permissions.";denied.classList.remove("hidden");return;}
  message.textContent="Administrator access verified for "+session.user.email+".";content.classList.remove("hidden");
  $("catalogPanel").classList.remove("hidden");await loadProducts();
}
verifyAdmin();
