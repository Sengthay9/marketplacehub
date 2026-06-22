"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard, MapPin, Tag, Check, ArrowRight,
  Banknote, Smartphone, Building2, Plus, Trash2, Star, QrCode,
} from "lucide-react";
import Image from "next/image";
import api from "@/lib/axios";
import { orderService } from "@/services/order.service";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import type { Address } from "@/types";
import CardInput, { type CardData } from "./CardInput";
import SaveCardModal from "./SaveCardModal";
import PaymentQRModal, { type ShopQrCode } from "./PaymentQRModal";
import CardProcessingModal from "./CardProcessingModal";

const schema = z.object({
  address_id:     z.number({ required_error: "Please select a delivery address." }),
  payment_method: z.enum(["cod", "qr", "card"]),
  saved_card_id:  z.number().optional(),
  coupon_code:    z.string().optional(),
  notes:          z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_METHODS = [
  { value: "cod",  label: "Cash on Delivery",     desc: "Pay when your order arrives",                 Icon: Banknote,   color: "text-green-600" },
  { value: "qr",   label: "QR / Bank Transfer",   desc: "ABA, Bakong, ACLEDA — scan shop's QR code",  Icon: QrCode,     color: "text-blue-600",  badge: "QR" },
  { value: "card", label: "Credit / Debit Card",  desc: "Visa, Mastercard, Amex, Discover",            Icon: CreditCard, color: "text-primary" },
] as const;

const EMPTY_CARD: CardData = { number: "", holder: "", expiryMonth: "", expiryYear: "", cvv: "" };

function validateCard(c: CardData): Partial<Record<keyof CardData, string>> {
  const e: Partial<Record<keyof CardData, string>> = {};
  if (c.number.length < 13)        e.number     = "Enter a valid card number.";
  if (!c.holder.trim())            e.holder     = "Enter the cardholder name.";
  if (!c.expiryMonth || !c.expiryYear) e.expiryMonth = "Enter expiry date.";
  if (c.cvv.length < 3)            e.cvv        = "Enter CVV.";
  return e;
}

export default function CheckoutView() {
  const router = useRouter();
  const qc = useQueryClient();
  const { clearCart } = useCartStore();

  const [couponInput, setCouponInput]     = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string>();
  const [cardData, setCardData]           = useState<CardData>(EMPTY_CARD);
  const [cardErrors, setCardErrors]       = useState<Partial<Record<keyof CardData, string>>>({});
  const [useNewCard, setUseNewCard]       = useState(false);

  // Selected QR code from shop's list
  const [selectedQr, setSelectedQr]       = useState<ShopQrCode | null>(null);

  // Post-order modal states
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal]   = useState(false);
  const [showQrModal, setShowQrModal]       = useState(false);
  const [showCardModal, setShowCardModal]   = useState(false);
  const [orderRef, setOrderRef]             = useState("");
  const [orderTotal, setOrderTotal]         = useState(0);

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await api.get("/customer/addresses")).data.data as Address[],
  });

  const { data: savedCards } = useQuery({
    queryKey: ["saved-cards"],
    queryFn: async () => (await api.get("/customer/cards")).data.data as any[],
  });

  // Fetch the cart to know which shop(s) are in it, then fetch their QR codes
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get("/customer/cart")).data,
  });

  // Get the first shop slug from cart items (single-shop QR flow)
  const shopSlug: string | null = cart?.items?.[0]?.product?.shop?.slug ?? null;

  const { data: shopQrCodes } = useQuery({
    queryKey: ["shop-qr", shopSlug],
    queryFn: async () => (await api.get(`/shops/${shopSlug}/payment-qr`)).data.data as ShopQrCode[],
    enabled: !!shopSlug,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { payment_method: "cod" },
  });

  const selectedAddress = watch("address_id");
  const paymentMethod   = watch("payment_method");
  const savedCardId     = watch("saved_card_id");

  const { data: summary } = useQuery({
    queryKey: ["checkout-summary", appliedCoupon],
    queryFn: () => orderService.summary(appliedCoupon),
  });

  const applyCouponMutation = useMutation({
    mutationFn: () => orderService.applyCoupon(couponInput),
    onSuccess: () => { setAppliedCoupon(couponInput); toast.success("Coupon applied!"); },
    onError: () => toast.error("Invalid or expired coupon."),
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customer/cards/${id}`),
    onSuccess: () => { toast.success("Card removed."); qc.invalidateQueries({ queryKey: ["saved-cards"] }); },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: FormData) => {
      // Map internal 'qr' method to the actual bank gateway name
      const payload: any = { ...data, coupon_code: appliedCoupon };
      if (data.payment_method === "qr" && selectedQr) {
        payload.payment_method = selectedQr.bank_name; // aba | bakong | acleda | etc.
      }
      return orderService.placeOrder(payload);
    },
    onSuccess: (res) => {
      clearCart();
      const id    = res.order.id;
      const ref   = res.order.order_number ?? `#${id}`;
      const total = summary?.total ?? 0;
      setSuccessOrderId(id);
      setOrderRef(ref);
      setOrderTotal(total);

      if (paymentMethod === "qr" && selectedQr) {
        setShowQrModal(true);
      } else if (paymentMethod === "card") {
        setShowCardModal(true);
      } else {
        // COD — go straight to order page
        toast.success("Order placed!");
        router.push(`/orders/${id}`);
      }
    },
    onError: () => toast.error("Failed to place order. Please try again."),
  });

  const onSubmit = (data: FormData) => {
    if (data.payment_method === "qr" && !selectedQr) {
      toast.error("Please select a QR payment option.");
      return;
    }
    if (data.payment_method === "card" && useNewCard) {
      const errs = validateCard(cardData);
      if (Object.keys(errs).length > 0) { setCardErrors(errs); return; }
    }
    placeOrderMutation.mutate(data);
  };

  const hasSavedCards = savedCards && savedCards.length > 0;

  // Group shop QR codes by currency for display
  const qrByUSD = shopQrCodes?.filter((q) => q.currency === "usd") ?? [];
  const qrByKHR = shopQrCodes?.filter((q) => q.currency === "khr") ?? [];

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-2 gap-8">
        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* Delivery Address */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Delivery Address
            </h2>
            {!addresses?.length ? (
              <div className="text-center py-6 bg-muted/40 rounded-xl border-2 border-dashed">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm mb-3">No delivery address saved yet.</p>
                <a href="/account"
                  className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline">
                  Add address in My Account <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedAddress === addr.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                    }`}
                  >
                    <input type="radio" value={addr.id}
                      {...register("address_id", { valueAsNumber: true })}
                      className="mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">{addr.label} — {addr.recipient_name}</p>
                      <p className="text-xs text-muted-foreground">{addr.street}, {addr.city}</p>
                      <p className="text-xs text-muted-foreground">{addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {errors.address_id && <p className="text-destructive text-xs mt-2">{errors.address_id.message}</p>}
          </div>

          {/* Payment Method */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Payment Method
            </h2>

            <div className="space-y-2 mb-4">
              {PAYMENT_METHODS.map(({ value, label, desc, Icon, color, ...rest }) => (
                <label key={value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                    paymentMethod === value ? "border-primary bg-primary/5" : "hover:border-primary/40"
                  }`}
                >
                  <input type="radio" value={value} {...register("payment_method")} />
                  <Icon className={`w-5 h-5 ${color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{label}</span>
                      {"badge" in rest && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color} border-current`}>
                          {(rest as any).badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* QR bank selector — shown when QR is selected */}
            {paymentMethod === "qr" && (
              <div className="mt-2 space-y-4">
                {!shopQrCodes ? (
                  <p className="text-sm text-muted-foreground">Loading available QR options…</p>
                ) : shopQrCodes.length === 0 ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                    This shop has not set up QR payment yet. Please choose another payment method.
                  </div>
                ) : (
                  <>
                    {[
                      { label: "Pay in USD ($)", items: qrByUSD },
                      { label: "Pay in KHR (៛)", items: qrByKHR },
                    ].filter((g) => g.items.length > 0).map((group) => (
                      <div key={group.label}>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {group.items.map((qr) => (
                            <button
                              key={qr.id}
                              type="button"
                              onClick={() => setSelectedQr(qr)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition text-left ${
                                selectedQr?.id === qr.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="w-16 h-16 relative bg-white rounded-lg p-1 border">
                                <Image
                                  src={qr.qr_image_url}
                                  alt={qr.bank_label}
                                  fill
                                  className="object-contain rounded"
                                  onError={(e) => { (e.target as any).style.display = "none"; }}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-semibold leading-tight">{qr.bank_label}</p>
                                {qr.account_name && (
                                  <p className="text-[10px] text-muted-foreground">{qr.account_name}</p>
                                )}
                              </div>
                              {selectedQr?.id === qr.id && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {selectedQr && (
                      <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-3">
                        A full-size QR code will be shown after placing your order. Open your {selectedQr.bank_label} app to scan and complete payment.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Card section */}
            {paymentMethod === "card" && (
              <div className="space-y-4 mt-2">
                {hasSavedCards && !useNewCard && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Saved Cards</p>
                    {savedCards.map((card) => (
                      <label key={card.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                          savedCardId === card.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                        }`}
                      >
                        <input type="radio" value={card.id}
                          onChange={() => setValue("saved_card_id", card.id)}
                          checked={savedCardId === card.id}
                          className="shrink-0"
                        />
                        <CreditCard className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-medium">{card.masked_number}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {card.card_brand} · {card.card_holder_name} · Exp {card.expiry_month}/{card.expiry_year?.slice(2)}
                          </p>
                        </div>
                        {card.is_default && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Star className="w-3 h-3 fill-primary" /> Default
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteCardMutation.mutate(card.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setUseNewCard(true); setValue("saved_card_id", undefined); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Plus className="w-4 h-4" /> Use a different card
                    </button>
                  </div>
                )}

                {(!hasSavedCards || useNewCard) && (
                  <div>
                    {hasSavedCards && (
                      <button
                        type="button"
                        onClick={() => setUseNewCard(false)}
                        className="text-xs text-primary hover:underline mb-3 block"
                      >
                        ← Use a saved card
                      </button>
                    )}
                    <CardInput value={cardData} onChange={setCardData} errors={cardErrors} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-bold mb-3">
              Order Notes <span className="text-muted-foreground font-normal text-sm">(optional)</span>
            </h2>
            <textarea {...register("notes")} rows={3}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Any special instructions for delivery…"
            />
          </div>
        </div>

        {/* ── Right column — Summary ── */}
        <div>
          <div className="bg-card border rounded-2xl p-6 sticky top-24">
            <h2 className="font-bold mb-4">Order Summary</h2>

            {/* Coupon */}
            <div className="flex gap-2 mb-5">
              <div className="flex-1 flex items-center border rounded-xl overflow-hidden">
                <Tag className="w-4 h-4 text-muted-foreground ml-3 shrink-0" />
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="COUPON CODE"
                  className="flex-1 px-2 py-2.5 text-sm bg-transparent focus:outline-none"
                />
              </div>
              <button type="button"
                onClick={() => applyCouponMutation.mutate()}
                disabled={!couponInput || applyCouponMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Apply
              </button>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              {[
                ["Subtotal",  formatCurrency(summary?.subtotal ?? 0)],
                ["Shipping",  formatCurrency(summary?.shipping_fee ?? 0)],
                ["Tax (10%)", formatCurrency(summary?.tax_amount ?? 0)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{val}</span>
                </div>
              ))}
              {(summary?.discount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Discount</span>
                  <span>-{formatCurrency(summary!.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(summary?.total ?? 0)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placeOrderMutation.isPending || !addresses?.length}
              className="w-full mt-5 py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
            >
              {placeOrderMutation.isPending ? "Placing Order…" : "Place Order"}
            </button>

            {!addresses?.length && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Add a delivery address to continue
              </p>
            )}
          </div>
        </div>
      </form>

      {/* QR Payment Modal */}
      {showQrModal && successOrderId && selectedQr && (
        <PaymentQRModal
          orderId={successOrderId}
          orderRef={orderRef}
          total={orderTotal}
          qrCode={selectedQr}
          onSuccess={() => router.push(`/orders/${successOrderId}`)}
          onCancel={() => { setShowQrModal(false); router.push(`/orders/${successOrderId}`); }}
        />
      )}

      {/* Card Processing Modal */}
      {showCardModal && successOrderId && (
        <CardProcessingModal
          orderId={successOrderId}
          savedCardId={!useNewCard ? savedCardId : undefined}
          onSuccess={() => {
            if (useNewCard) {
              setShowCardModal(false);
              setShowSaveModal(true);
            } else {
              router.push(`/orders/${successOrderId}`);
            }
          }}
          onFailure={() => setShowCardModal(false)}
        />
      )}

      {/* Save Card Modal — shown after card payment if new card was used */}
      {showSaveModal && successOrderId && (
        <SaveCardModal
          cardData={cardData}
          onClose={() => {
            setShowSaveModal(false);
            router.push(`/orders/${successOrderId}`);
          }}
        />
      )}
    </>
  );
}
