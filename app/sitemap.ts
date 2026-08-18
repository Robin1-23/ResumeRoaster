import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://resume-roaster.pro",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    }
  ];
}
