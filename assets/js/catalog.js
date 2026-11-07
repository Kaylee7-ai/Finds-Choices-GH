import { supabase } from "./supabase-client.js";

const grid = document.getElementById("productGrid");
if (grid) {
  const money = value => value == null
    ? ""
    : new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS",
        maximumFractionDigits: 2
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

    if (error) throw error;

    // Keep the hand-curated HTML catalogue as a fallback only.
    // Once live products exist, replace the fallback instead of duplicating it.
    if (Array.isArray(data) && data.length > 0) {
      const cards = data.map(product => {
        const card = make("article", "product-card");
        card.dataset.category = product.category || "Other";
        card.dataset.search = [
          product.name,
          product.description,
          product.category,
          product.retailer
        ].filter(Boolean).join(" ").toLocaleLowerCase();

        const imageWrap = make("div", "product-image-wrap");
        if (product.image_url) {
          const image = make("img", "product-image");
          image.src = product.image_url;
          image.alt = product.name || "Product image";
          image.loading = "lazy";
          image.referrerPolicy = "no-referrer";
          image.addEventListener("error", () => {
            image.remove();
            if (!imageWrap.querySelector(".image-fallback")) {
              imageWrap.append(make("span", "muted image-fallback", "Image unavailable"));
            }
          }, { once: true });
          imageWrap.append(image);
        } else {
          imageWrap.append(make("span", "muted image-fallback", "Image unavailable"));
        }

        const content = make("div", "product-content");
        const meta = make("div", "product-meta");
        meta.append(
          make("span", "category-pill", product.category || "Other"),
          make("span", "retailer", product.retailer || "Store listing")
        );

        content.append(
          meta,
          make("h3", "", product.name || "Untitled product"),
          make("p", "description", product.description || "View the retailer listing for product details.")
        );

        const priceRow = make("div", "price-row");
        if (product.price != null) priceRow.append(make("strong", "", money(product.price)));
        if (product.compare_at_price != null) {
          priceRow.append(make("span", "old-price", money(product.compare_at_price)));
        }
        content.append(priceRow);

        const link = make("a", "shop-button", "Continue to retailer ↗");
        link.href = product.product_url;
        link.target = "_blank";
        link.rel = "sponsored nofollow noopener noreferrer";
        link.setAttribute("aria-label", `View ${product.name || "product"} at ${product.retailer || "the retailer"}`);
        content.append(link);

        if (product.product_type === "affiliate") {
          content.append(make(
            "small",
            "product-note",
            "Affiliate disclosure: we may earn a commission if you purchase through this link, at no extra cost to you."
          ));
        }

        card.append(imageWrap, content);
        return card;
      });

      grid.replaceChildren(...cards);
      grid.dispatchEvent(new CustomEvent("catalog:updated"));
    }
  } catch (error) {
    // A failed or empty database request must not remove the working fallback.
    console.warn("Live catalogue unavailable; showing the curated catalogue.", error);
  }
}
