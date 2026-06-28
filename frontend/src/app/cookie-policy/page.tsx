"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLangStore } from "@/store/lang.store";

export default function CookiePolicyPage() {
  const { lang } = useLangStore();
  const km = lang === "km";

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground transition">{km ? "ទំព័រដើម" : "Home"}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{km ? "គោលការណ៍ខូគី" : "Cookie Policy"}</span>
        </nav>
        <h1 className="text-4xl font-bold mb-2">{km ? "គោលការណ៍ខូគី" : "Cookie Policy"}</h1>
        <p className="text-muted-foreground mb-10">{km ? "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ២៧ មិថុនា ២០២៦" : "Last updated: June 27, 2026"}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១. តើខូគីគឺជាអ្វី?" : "1. What Are Cookies?"}</h2>
            <p>
              {km
                ? "ខូគីគឺជាឯកសារអត្ថបទតូចៗដែលត្រូវបានរក្សាទុកនៅលើឧបករណ៍របស់អ្នក (កុំព្យូទ័រ ថេប្លេត ឬទូរស័ព្ទ) នៅពេលអ្នកចូលទស្សនាគេហទំព័រ។ ពួកវាជួយគេហទំព័រចងចាំចំណូលចិត្តរបស់អ្នក រក្សាអ្នកឱ្យបានចូល និងយល់ពីរបៀបដែលអ្នកប្រើប្រាស់ site ដើម្បីឱ្យយើងអាចកែលម្អវា។"
                : "Cookies are small text files that are stored on your device (computer, tablet, or phone) when you visit a website. They help the website remember your preferences, keep you logged in, and understand how you use the site so we can improve it."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "២. របៀបដែល CamCart ប្រើខូគី" : "2. How CamCart Uses Cookies"}</h2>
            <p>{km ? "CamCart ប្រើខូគីដើម្បី៖" : "CamCart uses cookies to:"}</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>{km ? "រក្សាអ្នកឱ្យបានចូលគណនី។" : "Keep you signed in to your account."}</li>
              <li>{km ? "ចងចាំទំនិញក្នុងរទេះទិញទំនិញរបស់អ្នក។" : "Remember items in your shopping cart."}</li>
              <li>{km ? "រក្សាទុកភាសា និងរូបរាង (ពន្លឺ/ងងឹត) ចំណូលចិត្តរបស់អ្នក។" : "Save your language and theme (light/dark mode) preferences."}</li>
              <li>{km ? "យល់ពីរបៀបដែលភ្ញៀវប្រើប្រាស់វេទិការបស់យើង ដើម្បីឱ្យយើងអាចកែលម្អ។" : "Understand how visitors use our platform so we can improve it."}</li>
              <li>{km ? "រកឃើញការក្លែងបន្លំ និងការពារសុវត្ថិភាពវេទិកា។" : "Detect fraud and protect the security of the Platform."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៣. ប្រភេទខូគីដែលយើងប្រើ" : "3. Types of Cookies We Use"}</h2>

            <div className="space-y-5 mt-2">
              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-1">{km ? "ខូគីចាំបាច់" : "Essential Cookies"}</h3>
                <p className="text-muted-foreground">{km ? "ចាំបាច់សម្រាប់ដំណើរការវេទិកា។ ទាំងនេះរួមមានសេសុន token ការចូលរបស់អ្នក និងទិន្នន័យរទេះទំនិញ។ អ្នកមិនអាចបដិសេធខូគីទាំងនេះ ព្រោះ site នឹងមិនដំណើរការដោយគ្មានពួកវា។" : "Required for the Platform to function. These include your login session token and shopping cart data. You cannot opt out of these cookies as the site will not work without them."}</p>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-1">{km ? "ខូគីចំណូលចិត្ត" : "Preference Cookies"}</h3>
                <p className="text-muted-foreground">{km ? "ចងចាំការកំណត់របស់អ្នក ដូចជាភាសា (ភាសាអង់គ្លេស/ខ្មែរ) និងរូបរាង (ពន្លឺ/ងងឹត)។ ទាំងនេះត្រូវបានរក្សាទុកក្នុងក្នុងកម្មវិធីរុករករបស់អ្នក។" : "Remember your settings such as language (English/Khmer) and display theme (light/dark mode). These are stored locally in your browser."}</p>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-1">{km ? "ខូគីវិភាគ" : "Analytics Cookies"}</h3>
                <p className="text-muted-foreground">{km ? "ជួយយើងយល់ពីទំព័រណាដែលត្រូវបានចូលមើលច្រើន អ្នកប្រើប្រាស់មកពីណា និងរបៀបដែលពួកគេប្រើវេទិកា។ ទិន្នន័យនេះត្រូវបានប្រមូលរួម និងអនាមិក។ យើងអាចប្រើឧបករណ៍ដូចជា Google Analytics សម្រាប់គោលបំណងនេះ។" : "Help us understand which pages are visited most, where users come from, and how they interact with the Platform. This data is aggregated and anonymous. We may use tools such as Google Analytics for this purpose."}</p>
              </div>

              <div className="border rounded-xl p-4">
                <h3 className="font-bold mb-1">{km ? "ខូគីសុវត្ថិភាព" : "Security Cookies"}</h3>
                <p className="text-muted-foreground">{km ? "ប្រើដើម្បីរកឃើញ និងការពារសកម្មភាពក្លែងបន្លំ ការពារគណនីរបស់អ្នក និងធានាប្រតិបត្តិការប្រកបដោយសុវត្ថិភាពនៅលើវេទិកា។" : "Used to detect and prevent fraudulent activity, protect your account, and ensure secure transactions on the Platform."}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៤. ខូគីភាគីទីបី" : "4. Third-Party Cookies"}</h2>
            <p>
              {km
                ? "មុខងារមួយចំនួននៅ CamCart អាចផ្ទុកមាតិកាពីសេវាកម្មភាគីទីបី (ដូចជាអ្នកដំណើរការការទូទាត់ ឬផែនទីដែលបានបង្កប់)។ ភាគីទីបីទាំងនេះអាចកំណត់ខូគីផ្ទាល់ខ្លួនរបស់ពួកគេនៅលើឧបករណ៍របស់អ្នក។ យើងមិនគ្រប់គ្រងខូគីទាំងនេះ។ សូមមើលគោលការណ៍ភាពឯកជនភាគីទីបីដែលពាក់ព័ន្ធ ដើម្បីបានព័ត៌មានបន្ថែម។"
                : "Some features on CamCart may load content from third-party services (such as payment processors or embedded maps). These third parties may set their own cookies on your device. We do not control these cookies. Please refer to the respective third-party privacy policies for more information."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៥. របៀបគ្រប់គ្រងខូគី" : "5. How to Control Cookies"}</h2>
            <p className="mb-2">
              {km ? "អ្នកអាចគ្រប់គ្រង និងលុបខូគីតាមការកំណត់កម្មវិធីរុករករបស់អ្នក។ ខាងក្រោមគឺជាការណែនាំសម្រាប់កម្មវិធីរុករកទូទៅ៖" : "You can control and delete cookies through your browser settings. Here is how to manage cookies in common browsers:"}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Chrome:</strong> {km ? "ការកំណត់" : "Settings"} &rarr; {km ? "ភាពឯកជន និងសុវត្ថិភាព" : "Privacy and Security"} &rarr; {km ? "ខូគី និងទិន្នន័យ site ផ្សេងទៀត" : "Cookies and other site data"}</li>
              <li><strong>Mozilla Firefox:</strong> {km ? "ការកំណត់" : "Settings"} &rarr; {km ? "ភាពឯកជន និងសុវត្ថិភាព" : "Privacy & Security"} &rarr; {km ? "ខូគី និងទិន្នន័យ Site" : "Cookies and Site Data"}</li>
              <li><strong>Safari:</strong> {km ? "ចំណូលចិត្ត" : "Preferences"} &rarr; {km ? "ភាពឯកជន" : "Privacy"} &rarr; {km ? "គ្រប់គ្រងទិន្នន័យគេហទំព័រ" : "Manage Website Data"}</li>
              <li><strong>Microsoft Edge:</strong> {km ? "ការកំណត់" : "Settings"} &rarr; {km ? "ខូគី និងការអនុញ្ញាត site" : "Cookies and site permissions"}</li>
            </ul>
            <p className="mt-3">
              {km
                ? "សូមចំណាំថា ការបិទខូគីចាំបាច់ អាចរារាំងមុខងារ CamCart មួយចំនួន រួមមានការបន្តចូល និងការប្រើរទេះទំនិញ។"
                : "Please note that disabling essential cookies may prevent certain features of CamCart from working correctly, including staying logged in and using the shopping cart."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៦. រយៈពេលខូគី" : "6. Cookie Duration"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{km ? "ខូគីសេសុន៖" : "Session cookies:"}</strong> {km ? "ត្រូវបានលុបដោយស្វ័យប្រវត្តិនៅពេលអ្នកបិទកម្មវិធីរុករករបស់អ្នក។" : "Deleted automatically when you close your browser."}</li>
              <li><strong>{km ? "ខូគីជាប់រហូត៖" : "Persistent cookies:"}</strong> {km ? "នៅសល់នៅលើឧបករណ៍របស់អ្នករយៈពេលកំណត់ (ជាធម្មតា ៣០ ថ្ងៃសម្រាប់សេសុនការចូល) ឬរហូតដល់អ្នកលុបពួកវាដោយដៃ។" : "Remain on your device for a set period (typically 30 days for login sessions) or until you delete them manually."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៧. ការធ្វើបច្ចុប្បន្នភាពគោលការណ៍នេះ" : "7. Updates to This Policy"}</h2>
            <p>
              {km
                ? 'យើងអាចធ្វើបច្ចុប្បន្នភាពគោលការណ៍ខូគីនេះ នៅពេលយើងបន្ថែមមុខងារថ្មី ឬនៅពេលច្បាប់ផ្លាស់ប្ដូរ។ កាលបរិច្ឆេទ "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ" នៅផ្នែកខាងលើនៃទំព័រនេះ ឆ្លុះបញ្ចាំងការកែប្រែថ្មីបំផុត។ ការបន្តប្រើ CamCart បន្ទាប់ពីការផ្លាស់ប្ដូរ មានន័យថាអ្នកទទួលយកគោលការណ៍ដែលបានធ្វើបច្ចុប្បន្នភាព។'
                : "We may update this Cookie Policy as we add new features or as laws change. The \"Last updated\" date at the top of this page reflects the most recent revision. Continued use of CamCart after changes are posted means you accept the updated policy."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៨. ទំនាក់ទំនងយើង" : "8. Contact Us"}</h2>
            <p>{km ? "ប្រសិនបើអ្នកមានសំណួរអំពីការប្រើខូគីរបស់យើង សូមទំនាក់ទំនងយើង៖" : "If you have questions about our use of cookies, please contact us:"}</p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li><strong>{km ? "អ៊ីម៉ែល៖" : "Email:"}</strong> hello@camcart.shop</li>
              <li><strong>{km ? "ទូរស័ព្ទ៖" : "Phone:"}</strong> +855 12 345 678</li>
              <li><strong>{km ? "អាសយដ្ឋាន៖" : "Address:"}</strong> {km ? "ភ្នំពេញ ប្រទេសកម្ពុជា" : "Phnom Penh, Cambodia"}</li>
            </ul>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
