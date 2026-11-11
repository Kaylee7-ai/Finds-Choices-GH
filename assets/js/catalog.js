import { supabase } from "./supabase-client.js";

const grid = document.getElementById("productGrid");
if (grid) {
  const money = value => value == null ? "" : new Intl.NumberFormat("en-GH", {
    style: "currency", currency: "GHS", maximumFractionDigits: 2
  }).format(Number(value));
  const make = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };

  try {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,description,category,retailer,product_type,price,compare_at_price,image_url,product_url")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length) {
      // Prefer the live catalogue as a whole; never mix it with stale fallback cards.
      grid.replaceChildren();

      for (const product of data) {
        const card = make("article", "product-card");
        card.dataset.category = product.category || "";
        card.dataset.search = [product.name, product.description, product.category, product.retailer].join(" ").toLowerCase();

        const imageWrap = make("div", "product-image-wrap");
        if (product.image_url) {
          const image = make("img", "product-image");
          image.src = product.image_url;
          image.alt = product.name || "Product image";
          image.loading = "lazy";
          image.referrerPolicy = "no-referrer";
          image.onerror = () => {
            image.remove();
            imageWrap.append(make("span", "muted", "Image unavailable"));
          };
          imageWrap.append(image);
        } else {
          imageWrap.append(make("span", "muted", "Product image unavailable"));
        }

        const body = make("div", "product-content");
        const meta = make("div", "product-meta");
        meta.append(
          make("span", "category-pill", product.category || "Product"),
          make("span", "retailer", product.retailer || "External listing")
        );
        body.append(meta, make("h3", "", product.name || "Product"));
        if (product.description) body.append(make("p", "description", product.description));

        const price = make("div", "price-row");
        if (product.price != null) price.append(make("strong", "", money(product.price)));
        if (product.compare_at_price != null && Number(product.compare_at_price) > Number(product.price)) {
          price.append(make("span", "old-price", money(product.compare_at_price)));
        }
        if (price.childElementCount) body.append(price);

        const type = String(product.product_type || "retailer").toLowerCase();
        const ctaLabel = type === "digital" ? "View digital product ↗" :
          type === "resale" ? "View product details ↗" : "View at retailer ↗";
        const link = make("a", "shop-button", ctaLabel);
        link.href = product.product_url;
        link.target = "_blank";
        link.rel = type === "affiliate"
          ? "sponsored nofollow noopener noreferrer"
          : "nofollow noopener noreferrer";
        link.setAttribute("aria-label", ctaLabel + " — " + (product.name || "product"));
        body.append(link);

        if (type === "affiliate") {
          body.append(make("small", "product-note",
            "Affiliate disclosure: we may earn a commission if you purchase through this link, at no extra cost to you."));
        } else if (type === "resale") {
          body.append(make("small", "product-note",
            "Check the product listing for current availability, fulfilment and delivery details before ordering."));
        } else if (type === "digital") {
          body.append(make("small", "product-note",
            "Review the seller's description, format and delivery terms before purchasing."));
        } else {
          body.append(make("small", "product-note",
            "The retailer controls current pricing, availability, payment, delivery and returns."));
        }

        card.append(imageWrap, body);
        grid.append(card);
      }
    } else if (error) {
      console.warn("Live catalogue unavailable; keeping the curated fallback catalogue.", error);
    }
  } catch (error) {
    console.warn("Could not load the live catalogue; keeping the curated fallback catalogue.", error);
  } finally {
    window.applyCatalogFilters?.();
  }
}
