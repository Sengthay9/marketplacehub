"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import {
  Loader2, CheckCircle, Upload, User, FileText, Camera, ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

// ── Cambodia city → province map ──────────────────────────────────────────────
const CITY_PROVINCE: Record<string, string> = {
  "Phnom Penh":    "Phnom Penh",
  "Siem Reap":     "Siem Reap",
  "Battambang":    "Battambang",
  "Sihanoukville": "Preah Sihanouk",
  "Kampot":        "Kampot",
  "Kratié":        "Kratié",
  "Stung Treng":   "Stung Treng",
  "Banlung":       "Ratanakiri",
  "Sen Monorom":   "Mondulkiri",
  "Kampong Cham":  "Kampong Cham",
  "Kampong Chhnang": "Kampong Chhnang",
  "Chbar Mon":     "Kampong Speu",
  "Stung Sen":     "Kampong Thom",
  "Ta Khmau":      "Kandal",
  "Koh Kong":      "Koh Kong",
  "Prey Veng":     "Prey Veng",
  "Svay Rieng":    "Svay Rieng",
  "Takéo":         "Takéo",
  "Pursat":        "Pursat",
  "Suong":         "Tbong Khmum",
  "Samraong":      "Oddar Meanchey",
  "Preah Vihear":  "Preah Vihear",
  "Pailin":        "Pailin",
  "Kep":           "Kep",
  "Sisophon":      "Banteay Meanchey",
  "Poipet":        "Banteay Meanchey",
};

const CAMBODIA_CITIES = Object.keys(CITY_PROVINCE).sort();

// ── Step 1 fields ─────────────────────────────────────────────────────────────
type Step1 = {
  first_name:    string;
  last_name:     string;
  phone:         string;
  date_of_birth: string;
  gender:        "male" | "female" | "other";
  address:       string;
  city:          string;
  province:      string;
  purpose:       string;
};

const STEPS = [
  { icon: User,         label: "Personal Info" },
  { icon: FileText,     label: "ID Card" },
  { icon: Camera,       label: "Selfie" },
  { icon: ClipboardList, label: "Review" },
];

const inputCls =
  "w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

function ImageUploadBox({
  label, file, onFile,
}: { label: string; file: File | null; onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        className="border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition"
      >
        {file ? (
          <img
            src={URL.createObjectURL(file)}
            alt={label}
            className="h-full w-full object-cover rounded-xl"
          />
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Click to upload</p>
          </>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

export default function VendorRegisterForm() {
  const [step, setStep]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [step1Data, setStep1Data]   = useState<Step1 | null>(null);
  const [idFront, setIdFront]       = useState<File | null>(null);
  const [idBack, setIdBack]         = useState<File | null>(null);
  const [selfie, setSelfie]         = useState<File | null>(null);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } =
    useForm<Step1>();

  const selectedCity = watch("city");
  useEffect(() => {
    if (selectedCity && CITY_PROVINCE[selectedCity]) {
      setValue("province", CITY_PROVINCE[selectedCity]);
    }
  }, [selectedCity, setValue]);

  // ── Step 1 submit ────────────────────────────────────────────────────────────
  const onStep1 = (data: Step1) => {
    setStep1Data(data);
    setStep(1);
  };

  // ── Step 2 next ──────────────────────────────────────────────────────────────
  const onStep2Next = () => {
    if (!idFront || !idBack) {
      toast.error("Please upload both sides of your ID card.");
      return;
    }
    setStep(2);
  };

  // ── Step 3 next ──────────────────────────────────────────────────────────────
  const onStep3Next = () => {
    if (!selfie) {
      toast.error("Please upload your selfie with ID.");
      return;
    }
    setStep(3);
  };

  // ── Step 4 submit ─────────────────────────────────────────────────────────────
  const onSubmit = async () => {
    if (!step1Data || !idFront || !idBack || !selfie) return;
    setLoading(true);
    try {
      const form = new FormData();
      Object.entries(step1Data).forEach(([k, v]) => form.append(k, v as string));
      form.append("id_card_front",  idFront);
      form.append("id_card_back",   idBack);
      form.append("selfie_with_id", selfie);

      await api.post("/auth/vendor/register", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Submission failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="w-14 h-14 text-green-500" />
        </div>
        <h3 className="text-lg font-bold">Application submitted!</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Our team will review your documents. Once approved, you will be able to sign in with your username.
        </p>
        <p className="text-xs text-muted-foreground">
          Review usually takes 1–3 business days.
        </p>
        <Link
          href="/login"
          className="block w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  // ── Step indicator ────────────────────────────────────────────────────────────
  const StepBar = () => (
    <div className="flex items-center justify-between mb-6">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === step;
        const done   = i < step;
        return (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                done   ? "bg-green-500 text-white" :
                active ? "bg-primary text-white" :
                         "bg-muted text-muted-foreground"
              }`}
            >
              {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <p className={`text-xs mt-1 ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {s.label}
            </p>
            {i < STEPS.length - 1 && (
              <div className={`absolute hidden`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Step 1: Personal Info ─────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="space-y-4">
        <StepBar />
        <form onSubmit={handleSubmit(onStep1)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">First Name</label>
              <input {...register("first_name", { required: "Required" })} placeholder="John" className={inputCls} />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Last Name</label>
              <input {...register("last_name", { required: "Required" })} placeholder="Doe" className={inputCls} />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Phone Number</label>
            <input type="tel" {...register("phone", { required: "Required" })} placeholder="+855 12 345 678" className={inputCls} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">Date of Birth</label>
              <input type="date" {...register("date_of_birth", { required: "Required" })} className={inputCls} />
              {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Gender</label>
              <select {...register("gender", { required: "Required" })} className={inputCls}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Address</label>
            <input {...register("address", { required: "Required" })} placeholder="Street / Village / Commune" className={inputCls} />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">City</label>
              <select {...register("city", { required: "Required" })} className={inputCls}>
                <option value="">Select city…</option>
                {CAMBODIA_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Province</label>
              <select
                {...register("province", { required: "Required" })}
                disabled={!selectedCity}
                className={inputCls + (!selectedCity ? " opacity-50 cursor-not-allowed" : "")}
              >
                <option value="">
                  {selectedCity ? CITY_PROVINCE[selectedCity] ?? "Select province…" : "Select city first"}
                </option>
                {selectedCity && CITY_PROVINCE[selectedCity] && (
                  <option value={CITY_PROVINCE[selectedCity]}>{CITY_PROVINCE[selectedCity]}</option>
                )}
              </select>
              {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Business Purpose</label>
            <textarea
              {...register("purpose", { required: "Required" })}
              rows={2}
              placeholder="What will you sell on CamCart?"
              className={inputCls + " resize-none"}
            />
            {errors.purpose && <p className="text-xs text-red-500 mt-1">{errors.purpose.message}</p>}
          </div>

          <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition">
            Next: Upload ID →
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    );
  }

  // ── Step 2: ID Card ───────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-4">
        <StepBar />
        <p className="text-sm text-muted-foreground">Upload a clear photo of your National ID card.</p>

        <div className="grid grid-cols-2 gap-3">
          <ImageUploadBox label="ID Front" file={idFront} onFile={setIdFront} />
          <ImageUploadBox label="ID Back"  file={idBack}  onFile={setIdBack}  />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(0)} className="flex-1 py-3 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition">
            ← Back
          </button>
          <button onClick={onStep2Next} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition">
            Next: Selfie →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Selfie ────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="space-y-4">
        <StepBar />
        <p className="text-sm text-muted-foreground">
          Take a photo of yourself holding your ID card next to your face.
        </p>

        <ImageUploadBox label="Selfie with ID" file={selfie} onFile={setSelfie} />

        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="flex-1 py-3 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition">
            ← Back
          </button>
          <button onClick={onStep3Next} className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition">
            Next: Review →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Review & Submit ────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <StepBar />
      <p className="text-sm text-muted-foreground">Review your information before submitting.</p>

      <div className="bg-muted/40 rounded-xl p-4 space-y-1.5 text-sm">
        {step1Data && [
          ["Name",    `${step1Data.first_name} ${step1Data.last_name}`],
          ["Phone",   step1Data.phone],
          ["DOB",     step1Data.date_of_birth],
          ["Gender",  step1Data.gender],
          ["Address", step1Data.address],
          ["City",    step1Data.city || "—"],
          ["Province",step1Data.province || "—"],
          ["Purpose", step1Data.purpose],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between py-0.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "ID Front", file: idFront },
          { label: "ID Back",  file: idBack  },
          { label: "Selfie",   file: selfie  },
        ].map(({ label, file }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            {file && (
              <img
                src={URL.createObjectURL(file)}
                alt={label}
                className="w-full h-20 object-cover rounded-lg border"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => setStep(2)} className="flex-1 py-3 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition">
          ← Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Submitting…" : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
