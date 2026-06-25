"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, Upload, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface SiteSettings {
  site_name: string;
  logo_url: string | null;
}

export default function AdminWebsiteSettings() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => (await api.get("/admin/site-settings")).data,
  });

  useEffect(() => {
    if (data) setName(data.site_name);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("site_name", name);
      if (file) fd.append("logo", file);
      return api.post("/admin/site-settings", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast.success("Website settings saved!");
      setFile(null);
      setPreview(null);
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: () => toast.error("Failed to save."),
  });

  const removeLogoMutation = useMutation({
    mutationFn: () => api.delete("/admin/site-settings/logo"),
    onSuccess: () => {
      toast.success("Logo removed.");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const logoSrc = preview ?? data?.logo_url;

  return (
    <div className="bg-card border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
          <Globe className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="font-bold">Website</h3>
      </div>

      <div className="space-y-5">
        {/* Logo */}
        <div>
          <label className="text-sm font-medium block mb-2">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {logoSrc
                ? <img src={logoSrc} alt="logo" className="w-full h-full object-contain p-1" />
                : <Globe className="w-7 h-7 text-muted-foreground/40" />
              }
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-muted transition">
                <Upload className="w-3.5 h-3.5" /> Upload Logo
              </button>
              {(logoSrc) && (
                <button
                  type="button"
                  onClick={() => {
                    if (preview) { setPreview(null); setFile(null); }
                    else removeLogoMutation.mutate();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-muted-foreground mt-2">PNG, JPG or SVG — max 2MB</p>
        </div>

        {/* Site Name */}
        <div>
          <label className="text-sm font-medium block mb-1">Website Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="CamCart"
          />
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !name.trim()}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
          {saveMutation.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
