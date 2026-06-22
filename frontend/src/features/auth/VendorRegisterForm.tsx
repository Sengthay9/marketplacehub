"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, Check } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

type Step = 1 | 2 | 3;

export default function VendorRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: "",
    full_name: "",
    date_of_birth: "",
    gender: "",
    id_number: "",
    address: "",
    city: "",
    province: "",
    id_card_front: "",
    id_card_back: "",
    selfie_with_id: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputClass = "w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30";

  // Mock file upload → in production, upload to server and store URL
  const handleFileUpload = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // In production, upload to storage and get URL. For now, use object URL as placeholder.
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, [key]: url }));
    toast.success(`${key.replace(/_/g, " ")} uploaded.`);
  };

  const FileField = ({ field, label }: { field: keyof typeof form; label: string }) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <label className={`${inputClass} flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition`}>
        <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-sm flex-1 truncate">
          {form[field] ? "File selected ✓" : "Click to upload photo"}
        </span>
        {form[field] && <Check className="w-4 h-4 text-green-500 shrink-0" />}
        <input type="file" accept="image/*" className="sr-only" onChange={handleFileUpload(field)} />
      </label>
    </div>
  );

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/auth/vendor/register", form);
      router.push("/vendor-application-submitted");
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const first = Object.values(errors)[0] as string[];
        toast.error(first[0]);
      } else {
        toast.error(err?.response?.data?.message ?? "Submission failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Personal Info", "ID Documents", "Review & Submit"];

  return (
    <div className="max-w-lg w-full">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              i + 1 < step ? "bg-green-500 text-white" :
              i + 1 === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i + 1 === step ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
            </span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? "bg-green-500" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1 — Personal Info */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Personal Information</h2>
          <p className="text-sm text-muted-foreground">This must match your government-issued ID card exactly.</p>

          <div>
            <label className="block text-sm font-medium mb-1">Full Name (as on ID)</label>
            <input type="text" value={form.full_name} onChange={set("full_name")} className={inputClass} placeholder="Full legal name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input type="email" value={form.email} onChange={set("email")} className={inputClass} placeholder="your@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender</label>
              <select value={form.gender} onChange={set("gender")} className={inputClass}>
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">National ID Number</label>
            <input type="text" value={form.id_number} onChange={set("id_number")} className={inputClass} placeholder="ID card number" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea value={form.address} onChange={set("address")} rows={2} className={inputClass} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input type="text" value={form.city} onChange={set("city")} className={inputClass} placeholder="City" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Province (optional)</label>
              <input type="text" value={form.province} onChange={set("province")} className={inputClass} placeholder="Province" />
            </div>
          </div>

          <button
            onClick={() => {
              if (!form.full_name || !form.email || !form.date_of_birth || !form.gender || !form.id_number || !form.address || !form.city) {
                toast.error("Please fill in all required fields.");
                return;
              }
              setStep(2);
            }}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            Continue to Documents →
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have a vendor account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      )}

      {/* Step 2 — Documents */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">ID Card Documents</h2>
          <p className="text-sm text-muted-foreground">Upload clear photos of your National ID card. Documents are encrypted and only reviewed by our team.</p>

          <FileField field="id_card_front" label="ID Card — Front Side *" />
          <FileField field="id_card_back"  label="ID Card — Back Side *" />
          <FileField field="selfie_with_id" label="Selfie holding your ID (optional)" />

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <strong>Requirements:</strong> Clear, unobstructed photo. All 4 corners must be visible. No filters or edits.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border rounded-xl font-semibold hover:bg-muted transition">
              ← Back
            </button>
            <button
              onClick={() => {
                if (!form.id_card_front || !form.id_card_back) {
                  toast.error("Please upload both front and back of your ID card.");
                  return;
                }
                setStep(3);
              }}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition"
            >
              Review & Submit →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Review Your Application</h2>

          <div className="bg-card border rounded-xl p-4 space-y-2 text-sm">
            {[
              ["Full Name", form.full_name],
              ["Email", form.email],
              ["Date of Birth", form.date_of_birth],
              ["Gender", form.gender],
              ["ID Number", form.id_number],
              ["Address", form.address],
              ["City", form.city],
              ["Province", form.province || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1 border-b last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium capitalize">{value}</span>
              </div>
            ))}
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">ID Card Front</span>
              <span className="text-green-600 font-medium">✓ Uploaded</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">ID Card Back</span>
              <span className="text-green-600 font-medium">✓ Uploaded</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
            After submission, our team will review your application within <strong>1–3 business days</strong>. You will receive your login credentials by email once approved.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border rounded-xl font-semibold hover:bg-muted transition">
              ← Back
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
