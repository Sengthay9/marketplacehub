export const CAT_KM: Record<string, string> = {
  "electronics":   "អេឡិចត្រូនិច",
  "fashion":       "សម្លៀកបំពាក់",
  "home-living":   "ផ្ទះ & ការរស់នៅ",
  "home-and-living": "ផ្ទះ & ការរស់នៅ",
  "food-drinks":   "អាហារ & គ្រឿងផឹក",
  "food-and-drinks": "អាហារ & គ្រឿងផឹក",
  "sports":        "កីឡា",
  "books":         "សៀវភៅ",
  "beauty":        "សម្ផស្ស",
  "beauty-health": "សម្ផស្ស & សុខភាព",
  "toys-games":    "របស់លេង & ហ្គេម",
  "toys-and-games": "របស់លេង & ហ្គេម",
  "smartphones":   "ទូរស័ព្ទ",
  "automotive":    "យានយន្ត",
};

export function catName(slug: string, name: string, km: boolean): string {
  if (!km) return name;
  return CAT_KM[slug.toLowerCase()] ?? name;
}
