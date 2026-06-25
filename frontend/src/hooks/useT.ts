import { useLangStore } from "@/store/lang.store";
import { t as translate, type TKey } from "@/lib/i18n";

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: TKey) => translate(lang, key);
}
