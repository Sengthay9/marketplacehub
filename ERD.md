# MarketplaceHub — Entity Relationship Diagram

```mermaid
erDiagram
    users {
        bigint id PK
        string name
        string email UK
        string password
        string phone
        string avatar
        enum role "admin|vendor|customer"
        boolean email_verified
        timestamp email_verified_at
        timestamps
    }

    shops {
        bigint id PK
        bigint user_id FK
        string name
        string slug UK
        string logo
        string banner
        text description
        string contact_number
        string email
        text address
        decimal rating
        int review_count
        enum status "pending|approved|rejected|suspended"
        timestamps
    }

    categories {
        bigint id PK
        bigint parent_id FK
        string name
        string slug UK
        string icon
        string image
        boolean is_active
        int sort_order
        timestamps
    }

    products {
        bigint id PK
        bigint shop_id FK
        bigint category_id FK
        string name
        string slug UK
        string sku UK
        text description
        decimal price
        decimal discount_price
        int stock_quantity
        decimal rating
        int review_count
        enum status "draft|pending|published|rejected"
        boolean is_featured
        timestamps
    }

    product_variants {
        bigint id PK
        bigint product_id FK
        string sku UK
        json attributes
        decimal price
        decimal discount_price
        int stock_quantity
        boolean is_active
        timestamps
    }

    product_images {
        bigint id PK
        bigint product_id FK
        string path
        boolean is_primary
        int sort_order
        timestamps
    }

    inventories {
        bigint id PK
        bigint product_id FK
        bigint variant_id FK
        int quantity
        int low_stock_threshold
        timestamp last_updated
    }

    wishlists {
        bigint id PK
        bigint user_id FK
        timestamps
    }

    wishlist_items {
        bigint id PK
        bigint wishlist_id FK
        bigint product_id FK
        bigint variant_id FK
        timestamps
    }

    carts {
        bigint id PK
        bigint user_id FK
        string session_id
        timestamps
    }

    cart_items {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        bigint variant_id FK
        int quantity
        decimal unit_price
        timestamps
    }

    addresses {
        bigint id PK
        bigint user_id FK
        string label
        string recipient_name
        string phone
        text street
        string city
        string state
        string postal_code
        string country
        boolean is_default
        timestamps
    }

    orders {
        bigint id PK
        string order_number UK
        bigint user_id FK
        bigint shop_id FK
        bigint address_id FK
        bigint coupon_id FK
        decimal subtotal
        decimal discount_amount
        decimal tax_amount
        decimal shipping_fee
        decimal total
        enum status "pending|confirmed|processing|shipped|delivered|cancelled|refunded"
        string tracking_number
        text notes
        timestamps
    }

    order_items {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        bigint variant_id FK
        string product_name
        string variant_info
        int quantity
        decimal unit_price
        decimal total_price
        timestamps
    }

    payments {
        bigint id PK
        bigint order_id FK
        string gateway
        string transaction_id UK
        decimal amount
        enum status "pending|completed|failed|refunded"
        json metadata
        timestamps
    }

    reviews {
        bigint id PK
        bigint product_id FK
        bigint user_id FK
        bigint order_id FK
        int rating
        text comment
        json images
        text vendor_reply
        timestamp vendor_replied_at
        timestamps
    }

    coupons {
        bigint id PK
        bigint shop_id FK
        string code UK
        string description
        enum type "percentage|fixed"
        decimal value
        decimal min_order_amount
        decimal max_discount
        int usage_limit
        int used_count
        timestamp starts_at
        timestamp expires_at
        boolean is_active
        timestamps
    }

    coupon_usages {
        bigint id PK
        bigint coupon_id FK
        bigint user_id FK
        bigint order_id FK
        decimal discount_applied
        timestamps
    }

    notifications {
        bigint id PK
        bigint user_id FK
        string type
        string title
        text message
        json data
        timestamp read_at
        timestamps
    }

    users ||--o{ shops : "owns"
    users ||--o{ wishlists : "has"
    users ||--o{ carts : "has"
    users ||--o{ orders : "places"
    users ||--o{ reviews : "writes"
    users ||--o{ addresses : "has"
    users ||--o{ notifications : "receives"
    shops ||--o{ products : "sells"
    shops ||--o{ orders : "receives"
    shops ||--o{ coupons : "creates"
    categories ||--o{ products : "contains"
    categories ||--o{ categories : "parent"
    products ||--o{ product_variants : "has"
    products ||--o{ product_images : "has"
    products ||--o{ inventories : "tracked by"
    products ||--o{ reviews : "receives"
    product_variants ||--o{ inventories : "tracked by"
    wishlists ||--o{ wishlist_items : "contains"
    wishlist_items }o--|| products : "references"
    carts ||--o{ cart_items : "contains"
    cart_items }o--|| products : "references"
    orders ||--o{ order_items : "contains"
    orders ||--o{ payments : "paid by"
    coupons ||--o{ coupon_usages : "used in"
```
