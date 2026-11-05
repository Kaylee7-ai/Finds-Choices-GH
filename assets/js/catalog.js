import { supabase } from "./supabase-client.js";
const grid=document.getElementById("productGrid");
if(grid){
  const money=(v)=>v==null?"":new Intl.NumberFormat("en-GH",{style:"currency",currency:"GHS",maximumFractionDigits:2}).format(Number(v));
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  try{
    const {data,error}=await supabase.from("products").select("id,name,description,category,retailer,product_type,price,compare_at_price,image_url,product_url").eq("status","active").order("created_at",{ascending:false});
    if(!error&&data&&data.length){
      grid.replaceChildren();
      for(const p of data){
        const card=make("article","product-card");card.dataset.category=p.category;card.dataset.search=[p.name,p.description,p.category,p.retailer].join(" ").toLowerCase();
        const wrap=make("div","product-image-wrap");
        if(p.image_url){const img=make("img","product-image");img.src=p.image_url;img.alt=p.name;img.loading="lazy";img.referrerPolicy="no-referrer";img.onerror=()=>{img.remove();wrap.append(make("span","muted","Image unavailable"));};wrap.append(img);}else wrap.append(make("span","muted","Product image"));
        const body=make("div","product-content"),meta=make("div","product-meta");meta.append(make("span","category-pill",p.category),make("span","retailer",p.retailer||"Store listing"));
        body.append(meta,make("h3","",p.name),make("p","description",p.description||""));
        const price=make("div","price-row");if(p.price!=null)price.append(make("strong","",money(p.price)));if(p.compare_at_price!=null)price.append(make("span","old-price",money(p.compare_at_price)));body.append(price);
        const link=make("a","shop-button","Continue to retailer ↗");link.href=p.product_url;link.target="_blank";link.rel="sponsored nofollow noopener noreferrer";body.append(link);
        if(p.product_type==="affiliate")body.append(make("small","product-note","Affiliate listing: we may earn a commission if you buy through this link, at no extra cost to you."));
        card.append(wrap,body);grid.append(card);
      }
      const count=document.getElementById("catalogCount");if(count)count.textContent=data.length+" products";
    }
    // If the database has no active products, the original curated static catalogue remains visible.
  }catch(e){console.warn("Could not load live catalogue; showing existing catalogue.",e);}
}
