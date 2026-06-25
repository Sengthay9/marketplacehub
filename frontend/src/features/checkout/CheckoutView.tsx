"use client";

import { useState, useEffect } from "react";
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
import api from "@/lib/axios";
import { orderService } from "@/services/order.service";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart.store";
import type { Address } from "@/types";
import KhqrCard from "@/components/payment/KhqrCard";
import CardInput, { type CardData } from "./CardInput";
import SaveCardModal from "./SaveCardModal";
import PaymentQRModal, { type ShopQrCode } from "./PaymentQRModal";
import CardProcessingModal from "./CardProcessingModal";

const schema = z.object({
  address_id:     z.coerce.number({ required_error: "Please select a delivery address." }).min(1, "Please select a delivery address."),
  payment_method: z.enum(["cod", "qr", "card"]),
  saved_card_id:  z.number().optional(),
  coupon_code:    z.string().optional(),
  notes:          z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_METHODS = [
  { value: "cod",  label: "Cash on Delivery",     desc: "Pay when your order arrives",                 Icon: Banknote,   color: "text-green-600" },
  { value: "qr",   label: "Bakong KHQR",           desc: "Scan with ABA, ACLEDA, Wing or any Bakong app", Icon: QrCode, color: "text-blue-600", badge: "QR" },
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

  // Fetch the cart for item display
  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get("/customer/cart")).data,
  });

  // Fetch CamCart's platform Bakong account for QR payment
  const { data: platformAccount, isLoading: qrLoading } = useQuery({
    queryKey: ["platform-bank-account"],
    queryFn: async () => (await api.get("/platform/bank-account")).data.data,
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
    onError: (err: any) => {
      const msg = err?.response?.data?.errors?.coupon?.[0] ?? err?.response?.data?.message ?? "Invalid or expired coupon.";
      toast.error(msg);
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customer/cards/${id}`),
    onSuccess: () => { toast.success("Card removed."); qc.invalidateQueries({ queryKey: ["saved-cards"] }); },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: any = { ...data, coupon_code: appliedCoupon };
      if (data.payment_method === "qr") {
        payload.payment_method = "bakong";
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

  const [step, setStep] = useState<1 | 2>(1);

  // Auto-set platform QR when QR payment is chosen
  useEffect(() => {
    if (paymentMethod === "qr" && platformAccount && !selectedQr) {
      setSelectedQr({
        id: "platform",
        bank_name: "bakong",
        bank_label: "CamCart Pay (Bakong)",
        currency: "usd",
        qr_image_url: null,
        khqr_string: platformAccount.khqr_string ?? null,
        account_name: platformAccount.account_holder_name,
        account_number: platformAccount.account_number ?? null,
        phone_number: platformAccount.phone_number ?? null,
        is_khqr: !!platformAccount.khqr_string,
        is_platform: true,
      });
    }
    if (paymentMethod !== "qr") {
      setSelectedQr(null);
    }
  }, [paymentMethod, platformAccount]);

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ─── Shared order summary panel ─── */
  const OrderSummaryPanel = (
    <div className="bg-card border rounded-2xl p-6">
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

      {/* Item list */}
      <div className="space-y-3 text-sm mb-4">
        {cart?.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium leading-tight">{item.product?.name}</p>
              {item.variant_info && (
                <p className="text-[11px] text-muted-foreground">{item.variant_info}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {item.quantity} × {formatCurrency(item.unit_price)}
              </p>
            </div>
            <span className="shrink-0 font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Discount + Total */}
      <div className="space-y-2 text-sm border-t pt-3">
        {(summary?.discount ?? 0) > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Discount</span>
            <span>-{formatCurrency(summary!.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-1">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(summary?.total ?? 0)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { n: 1, label: "Delivery & Summary" },
          { n: 2, label: "Payment" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-3">
            {i > 0 && <div className={`h-px w-8 ${step >= n ? "bg-primary" : "bg-border"}`} />}
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step > n ? "bg-primary text-white" : step === n ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                {step > n ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === n ? "text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>

        {/* ══ STEP 1: Delivery & Summary ══ */}
        {step === 1 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Address + Notes */}
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
                    <a href="/account"
                      className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition"
                    >
                      <Plus className="w-4 h-4" /> Add a new address
                    </a>
                  </div>
                )}
                {errors.address_id && <p className="text-destructive text-xs mt-2">{errors.address_id.message}</p>}
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

            {/* Right: Order Summary + CTA */}
            <div className="space-y-4">
              <div className="sticky top-24 space-y-4">
                {OrderSummaryPanel}
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={!addresses?.length}
                  className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                  Proceed to Payment →
                </button>
                {!addresses?.length && (
                  <p className="text-xs text-center text-muted-foreground">Add a delivery address to continue</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2: Payment ══ */}
        {step === 2 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Payment method */}
            <div className="space-y-6">
              <div className="bg-card border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <button type="button" onClick={() => setStep(1)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition">
                    ← Back
                  </button>
                  <h2 className="font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Payment Method
                  </h2>
                </div>

                {/* Method selector */}
                <div className="space-y-2 mb-5">
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

                {/* COD: immediate checkout */}
                {paymentMethod === "cod" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                    Pay in cash when your order arrives. No upfront payment needed.
                  </div>
                )}

                {/* QR: CamCart platform Bakong QR */}
                {paymentMethod === "qr" && (
                  <div className="space-y-4">
                    {qrLoading ? (
                      <p className="text-sm text-muted-foreground">Loading QR…</p>
                    ) : !platformAccount ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                        QR payment is not available right now. Please choose another method.
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        {platformAccount.khqr_string ? (
                          <KhqrCard
                            khqrString={platformAccount.khqr_string}
                            merchantName={platformAccount.account_holder_name}
                            bankName="Bakong"
                            accountNumber={platformAccount.account_number ?? undefined}
                            currency="usd"
                            size={220}
                          />
                        ) : (
                          <div className="w-full bg-white border-2 border-dashed border-muted rounded-2xl p-8 flex items-center justify-center">
                            <QrCode className="w-24 h-24 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-3 w-full text-center">
                          Scan with ABA Pay, ACLEDA, Wing, or any Bakong-supported app and pay to <strong>CamCart</strong>.
                          The exact amount will be pre-filled when you confirm your order.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
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
                            <button type="button" onClick={() => deleteCardMutation.mutate(card.id)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </label>
                        ))}
                        <button type="button"
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
                          <button type="button" onClick={() => setUseNewCard(false)}
                            className="text-xs text-primary hover:underline mb-3 block">
                            ← Use a saved card
                          </button>
                        )}
                        <CardInput value={cardData} onChange={setCardData} errors={cardErrors} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Summary + Place Order */}
            <div className="space-y-4">
              <div className="sticky top-24 space-y-4">
                {OrderSummaryPanel}
                <button
                  type="submit"
                  disabled={
                    placeOrderMutation.isPending ||
                    (paymentMethod === "qr" && (qrLoading || !platformAccount))
                  }
                  className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {placeOrderMutation.isPending
                    ? "Placing Order…"
                    : paymentMethod === "qr" && (qrLoading || !platformAccount)
                    ? "Loading QR…"
                    : paymentMethod === "cod"
                    ? "Place Order"
                    : paymentMethod === "qr"
                    ? "I've Transferred — Place Order"
                    : "Pay & Place Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* QR Payment Modal — auto-redirects on success */}
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

      {/* Card Processing Modal — auto-redirects on success */}
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

      {/* Save Card Modal */}
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
