import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-xl font-black text-primary mb-3">
              🛍️ MarketplaceHub
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The multi-vendor marketplace for everyone. Browse, buy, and sell with confidence.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
              <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
              <li><Link href="/shops" className="hover:text-foreground">All Shops</Link></li>
              <li><Link href="/products?featured=true" className="hover:text-foreground">Featured</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Sell</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/vendor-register" className="hover:text-foreground">Become a Vendor</Link></li>
              <li><Link href="/login" className="hover:text-foreground">Vendor Sign In</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-foreground">Contact Us</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MarketplaceHub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
