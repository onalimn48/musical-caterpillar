import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, FAVICON_DATA_URL, PAGE_SEO, SITE_NAME, toCanonicalUrl } from "./siteMetadata.js";

function upsertMeta({ name, property, content }) {
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let meta = document.head.querySelector(selector);

  if (!meta) {
    meta = document.createElement("meta");
    if (name) {
      meta.setAttribute("name", name);
    }
    if (property) {
      meta.setAttribute("property", property);
    }
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

function upsertLink({ rel, href }) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

function upsertJsonLd({ path, title, description, schemaType }) {
  const scriptId = "route-json-ld";
  let script = document.getElementById(scriptId);

  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = scriptId;
    document.head.appendChild(script);
  }

  const url = toCanonicalUrl(path);
  const payload = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: title,
    description,
    url,
  };

  if (schemaType === "WebSite") {
    payload.publisher = {
      "@type": "Organization",
      name: SITE_NAME,
      url: toCanonicalUrl("/"),
    };
  }

  script.textContent = JSON.stringify(payload);
}

export default function Seo({ path, title, description, schemaType }) {
  useEffect(() => {
    const pageSeo = PAGE_SEO[path] ?? {};
    const resolvedTitle = title ?? pageSeo.title ?? PAGE_SEO["/"].title;
    const resolvedDescription = description ?? pageSeo.description ?? PAGE_SEO["/"].description;
    const resolvedSchemaType = schemaType ?? pageSeo.schemaType ?? "WebPage";
    const canonicalUrl = toCanonicalUrl(path);

    document.title = resolvedTitle;
    upsertLink({ rel: "canonical", href: canonicalUrl });
    upsertLink({ rel: "icon", href: FAVICON_DATA_URL });
    upsertMeta({ name: "description", content: resolvedDescription });
    upsertMeta({ name: "robots", content: "index,follow" });
    upsertMeta({ property: "og:site_name", content: SITE_NAME });
    upsertMeta({ property: "og:type", content: resolvedSchemaType === "Article" ? "article" : "website" });
    upsertMeta({ property: "og:title", content: resolvedTitle });
    upsertMeta({ property: "og:description", content: resolvedDescription });
    upsertMeta({ property: "og:url", content: canonicalUrl });
    upsertMeta({ property: "og:image", content: DEFAULT_OG_IMAGE });
    upsertMeta({ name: "twitter:card", content: "summary_large_image" });
    upsertMeta({ name: "twitter:title", content: resolvedTitle });
    upsertMeta({ name: "twitter:description", content: resolvedDescription });
    upsertMeta({ name: "twitter:image", content: DEFAULT_OG_IMAGE });
    upsertJsonLd({
      path,
      title: resolvedTitle,
      description: resolvedDescription,
      schemaType: resolvedSchemaType,
    });
  }, [description, path, schemaType, title]);

  return null;
}
