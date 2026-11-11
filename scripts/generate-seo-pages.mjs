import fs from "node:fs/promises";
import path from "node:path";

const SITE = "https://kaylee7-ai.github.io/Finds-Choices-GH";
const ROOT = process.cwd();
const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug = v => String(v||"general").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "general";
const https = v => { try { const u=new URL(String(v||"")); return u.protocol==="https:"?u.href:""; } catch { return ""; } };
const ppath = p => "products/"+slug(p.name)+"-"+String(p.id).replace(/[^a-zA-Z0-9]/g,"").slice(-8).toLowerCase()+"/";
const cpath = c => "categories/"+slug(c)+"/";

function page(title, desc, canonical, image, body, robots="index,follow") {
 const img=https(image);
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+esc(title)+'</title><meta name="description" content="'+esc(desc.slice(0,155))+'"><meta name="robots" content="'+robots+'">'+
 '<link rel="canonical" href="'+esc(canonical)+'"><meta name="theme-color" content="#10271d">'+
 '<meta property="og:type" content="website"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(desc.slice(0,200))+'"><meta property="og:url" content="'+esc(canonical)+'">'+
 (img?'<meta property="og:image" content="'+esc(img)+'">':'')+'<meta name="twitter:card" content="'+(img?'summary_large_image':'summary')+'">'+
 '<meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(desc.slice(0,200))+'">'+(img?'<meta name="twitter:image" content="'+esc(img)+'">':'')+
 '<link rel="icon" href="../../favicon.svg" type="image/svg+xml"><style>'+
 ':root{--forest:#10271d;--ink:#17251d;--muted:#68766d;--paper:#f4f2eb;--surface:#fffefa}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.7 Inter,system-ui,sans-serif}a{color:inherit}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}header{background:#fffefa;border-bottom:1px solid #e5e2d8}header .wrap{min-height:76px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{text-decoration:none;font-weight:850;letter-spacing:-.04em}.brand small{display:block;color:#758176;font-size:10px;letter-spacing:.16em;text-transform:uppercase}header nav{display:flex;gap:18px;flex-wrap:wrap}header nav a{font-size:13px;text-decoration:none;color:#536358;font-weight:750}main{padding:34px 0 58px}.crumbs{font-size:13px;color:var(--muted);margin-bottom:20px}.crumbs a{text-decoration:none}.panel{background:var(--surface);border:1px solid #e4e1d7;border-radius:22px;box-shadow:0 18px 48px #17291b0b;overflow:hidden}.product-layout{display:grid;grid-template-columns:1.02fr .98fr}.visual{padding:28px;background:radial-gradient(circle at 50% 42%,#fff,#e9e9df 82%);min-height:440px;display:grid;place-items:center}.visual img{display:block;width:100%;max-height:530px;object-fit:contain;border-radius:14px}.details{padding:clamp(25px,4vw,50px);display:flex;flex-direction:column;align-items:flex-start}.eyebrow{font-size:11px;letter-spacing:.19em;text-transform:uppercase;color:#987b4b;font-weight:850}h1,h2{font-family:Georgia,serif;font-weight:500;letter-spacing:-.055em;line-height:1.08}h1{font-size:clamp(2.3rem,4vw,3.6rem);margin:13px 0 16px}h2{font-size:clamp(1.8rem,3vw,2.4rem);margin:0 0 14px}.description{color:#59665c;white-space:pre-line}.meta{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px}.pill{border-radius:999px;background:#eef1e9;color:#4b684e;padding:5px 10px;font-size:12px;font-weight:800}.cta{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 23px;border-radius:999px;background:linear-gradient(110deg,#e5d2a7,#c5a56b);text-decoration:none;font-weight:850;margin:17px 0 8px}.note{font-size:12px;color:#778178}.section{margin-top:42px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:15px}.card{display:flex;flex-direction:column;background:#fffefa;border:1px solid #e5e2d8;border-radius:16px;overflow:hidden;text-decoration:none;transition:transform .2s,box-shadow .2s}.card:hover{transform:translateY(-4px);box-shadow:0 16px 35px #17291b14}.card img{width:100%;aspect-ratio:1.15;object-fit:contain;background:#efefe8;padding:12px}.card .pad{padding:14px}.card b{display:block;line-height:1.35}.card small{display:block;color:#778178;margin-top:6px}footer{background:#08140d;color:#c9d5cb;padding:26px 0;font-size:12px}footer a{color:#e7d4a9}@media(max-width:760px){header .wrap{padding:12px 0;align-items:flex-start;flex-direction:column}header nav{gap:13px}.product-layout{grid-template-columns:1fr}.visual{min-height:280px;padding:20px}.visual img{max-height:360px}.details{padding:25px}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){.grid{grid-template-columns:1fr 1fr}.card .pad{padding:10px}.card b{font-size:13px}}'+
 '</style></head><body><header><div class="wrap"><a class="brand" href="'+SITE+'/">Finds &amp; Choices GH<small>Discover better · Choose smarter</small></a><nav><a href="'+SITE+'/">Home</a><a href="'+SITE+'/#categories">Categories</a><a href="'+SITE+'/#catalog">Explore products</a></nav></div></header><main class="wrap">'+body+'</main><footer><div class="wrap">Finds &amp; Choices GH is an independent product-discovery platform. Retailer prices, variants, availability, fulfilment, delivery and returns are controlled by the retailer. Some eligible affiliate links may earn us a commission at no extra cost to you. <a href="'+SITE+'/#about">Our approach</a>.</div></footer></body></html>';
}
function card(p) {
 const image=https(p.image_url);
 return '<a class="card" href="'+SITE+'/'+ppath(p)+'">'+(image?'<img src="'+esc(image)+'" alt="'+esc(p.name)+'" loading="lazy">':'')+'<span class="pad"><b>'+esc(p.name)+'</b><small>'+esc(p.retailer||"Retailer listing")+'</small></span></a>';
}
function productPage(p, all) {
 const name=String(p.name||"Product"), cat=String(p.category||"Other finds"), desc=String(p.description||"Visit the retailer listing for the latest product information and specifications.");
 const image=https(p.image_url), retailer=https(p.product_url), canonical=SITE+'/'+ppath(p);
 const related=all.filter(x=>x.id!==p.id&&x.category===p.category).slice(0,4);
 let body='<div class="crumbs"><a href="'+SITE+'/">Home</a> / <a href="'+SITE+'/'+cpath(cat)+'">'+esc(cat)+'</a> / '+esc(name)+'</div>'+
 '<section class="panel product-layout"><div class="visual">'+(image?'<img src="'+esc(image)+'" alt="'+esc(name)+'" fetchpriority="high">':'<span>Product image not supplied yet</span>')+'</div><div class="details"><span class="eyebrow">Product discovery · '+esc(cat)+'</span><h1>'+esc(name)+'</h1><div class="meta"><span class="pill">'+esc(cat)+'</span><span class="pill">'+esc(p.retailer||"External retailer")+'</span></div><p class="description">'+esc(desc)+'</p>'+
 (p.price!=null?'<p><strong>Listed price: '+esc(p.currency||"GHS")+' '+esc(p.price)+'</strong><br><span class="note">Confirm current price and delivery charges on the retailer page.</span></p>':'<p class="note">Check the retailer page for current price, variants and availability.</p>')+
 (retailer?'<a class="cta" href="'+esc(retailer)+'" target="_blank" rel="'+(String(p.product_type).toLowerCase()==="affiliate"?"sponsored nofollow noopener noreferrer":"nofollow noopener noreferrer")+'">View product at '+esc(p.retailer||"retailer")+' ↗</a>':'')+
 '<p class="note">The retailer handles payment, fulfilment, delivery and returns. Confirm compatibility, variant, specifications and terms before ordering.</p>'+
 (String(p.product_type).toLowerCase()==="affiliate"?'<p class="note">Affiliate disclosure: we may earn a commission if you purchase through this link, at no extra cost to you.</p>':'')+'</div></section>'+
 '<section class="section"><h2>Before you choose</h2><p class="description">Compare the product details, check that the selected variant matches your needs, and review the retailer’s current price, delivery charges and return terms. Product information can change, so the retailer’s live listing is the final reference.</p></section>'+
 (related.length?'<section class="section"><h2>Explore more in '+esc(cat)+'</h2><div class="grid">'+related.map(card).join("")+'</div></section>':'');
 return page(name+' | Finds & Choices GH',desc,canonical,image,body);
}
function categoryPage(cat, products) {
 const items=products.filter(p=>p.category===cat), canonical=SITE+'/'+cpath(cat);
 const desc='Explore '+cat.toLowerCase()+' selected for discovery at Finds & Choices GH. Compare product details and visit retailers for current prices, variants and availability.';
 const body='<div class="crumbs"><a href="'+SITE+'/">Home</a> / '+esc(cat)+'</div><span class="eyebrow">Explore by category</span><h1>'+esc(cat)+'</h1><p class="description">'+esc(desc)+'</p>'+
 (items.length?'<div class="grid">'+items.map(card).join("")+'</div>':'<p class="description">We are still curating listings in this category. Browse all current finds from the <a href="'+SITE+'/#catalog">main collection</a>.</p>');
 return page(cat+' | Finds & Choices GH',desc,canonical,"",body,items.length?"index,follow":"noindex,follow");
}
async function main() {
 const config=await fs.readFile(path.join(ROOT,"assets/js/supabase-config.js"),"utf8");
 const url=config.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)?.[1], key=config.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)?.[1];
 if(!url||!key) throw new Error("Could not read public Supabase configuration.");
 const endpoint=new URL("/rest/v1/products",url);
 endpoint.search=new URLSearchParams({select:"id,name,description,category,retailer,product_type,price,currency,image_url,product_url,created_at,updated_at,status",status:"eq.active",order:"updated_at.desc",limit:"1000"}).toString();
 const response=await fetch(endpoint,{headers:{apikey:key,Authorization:"Bearer "+key,Accept:"application/json"}});
 if(!response.ok) throw new Error("Supabase catalogue request failed ("+response.status+"). No generated pages were changed.");
 const raw=await response.json();
 if(!Array.isArray(raw)) throw new Error("Unexpected Supabase catalogue response.");
 const products=raw.filter(p=>p&&p.id&&p.name&&https(p.product_url));
 if(raw.length&&!products.length) throw new Error("Active catalogue rows were returned, but none had valid HTTPS product links. Refusing to publish empty pages.");
 const pr=path.join(ROOT,"products"), cr=path.join(ROOT,"categories");
 await fs.rm(pr,{recursive:true,force:true}); await fs.rm(cr,{recursive:true,force:true});
 await fs.mkdir(pr,{recursive:true}); await fs.mkdir(cr,{recursive:true});
 const today=new Date().toISOString().slice(0,10), urls=[{loc:SITE+"/",date:today}];
 for(const p of products){
  const rel=ppath(p), dir=path.join(ROOT,rel); await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,"index.html"),productPage(p,products),"utf8");
  const d=p.updated_at||p.created_at; urls.push({loc:SITE+"/"+rel,date:d&&!Number.isNaN(Date.parse(d))?new Date(d).toISOString().slice(0,10):today});
 }
 const fixed=["Technology","Phone accessories","Home & Living","Digital products"];
 const cats=[...new Set([...fixed,...products.map(p=>String(p.category||"").trim()).filter(Boolean)])];
 for(const c of cats){
  const rel=cpath(c), dir=path.join(ROOT,rel); await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,"index.html"),categoryPage(c,products),"utf8");
  if(products.some(p=>p.category===c)) urls.push({loc:SITE+"/"+rel,date:today});
 }
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(u=>'  <url><loc>'+esc(u.loc)+'</loc><lastmod>'+u.date+'</lastmod></url>').join("\n")+'\n</urlset>\n';
 await fs.writeFile(path.join(ROOT,"sitemap.xml"),xml,"utf8");
 console.log("Generated "+products.length+" product pages, "+cats.length+" category pages and "+urls.length+" sitemap URLs.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
