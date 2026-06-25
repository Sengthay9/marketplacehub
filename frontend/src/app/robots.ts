import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/products", "/shops", "/categories", "/about", "/contact"],
        disallow: ["/admin", "/vendor", "/account", "/checkout", "/orders", "/api"],
      },
    ],
    sitemap: "https://camcart.vercel.app/sitemap.xml",
  };
}
