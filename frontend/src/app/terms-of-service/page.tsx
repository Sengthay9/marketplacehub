"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLangStore } from "@/store/lang.store";

export default function TermsOfServicePage() {
  const { lang } = useLangStore();
  const km = lang === "km";

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground transition">{km ? "ទំព័រដើម" : "Home"}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{km ? "លក្ខខណ្ឌនៃការប្រើប្រាស់" : "Terms of Service"}</span>
        </nav>
        <h1 className="text-4xl font-bold mb-2">{km ? "លក្ខខណ្ឌនៃការប្រើប្រាស់" : "Terms of Service"}</h1>
        <p className="text-muted-foreground mb-10">{km ? "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ២៧ មិថុនា ២០២៦" : "Last updated: June 27, 2026"}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១. ការទទួលយកលក្ខខណ្ឌ" : "1. Acceptance of Terms"}</h2>
            <p>
              {km
                ? 'តាមរយៈការចូលប្រើ ឬប្រើប្រាស់ CamCart ("វេទិកា") អ្នកយល់ព្រមចំពោះលក្ខខណ្ឌនៃការប្រើប្រាស់ទាំងនេះ។ លក្ខខណ្ឌទាំងនេះចំពោះអ្នកប្រើប្រាស់ទាំងអស់ រួមមានអ្នកទិញ អ្នកលក់ និងភ្ញៀវ។ ប្រសិនបើអ្នកមិនយល់ព្រម អ្នកត្រូវឈប់ប្រើប្រាស់វេទិកាភ្លាមៗ។'
                : "By accessing or using CamCart (\"the Platform\"), you agree to be bound by these Terms of Service. These terms apply to all users including buyers, vendors, and guests. If you do not agree, you must stop using the Platform immediately."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "២. អ្នកណាអាចប្រើ CamCart" : "2. Who Can Use CamCart"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{km ? "អ្នកត្រូវមានអាយុយ៉ាងតិច ១៨ ឆ្នាំ ដើម្បីបង្កើតគណនី។" : "You must be at least 18 years old to create an account."}</li>
              <li>{km ? "អ្នកត្រូវផ្ដល់ព័ត៌មានចុះឈ្មោះដែលត្រឹមត្រូវ និងស្មោះត្រង់។" : "You must provide accurate and truthful registration information."}</li>
              <li>{km ? "អ្នកទទួលខុសត្រូវក្នុងការថែរក្សាសុវត្ថិភាពគណនី និងពាក្យសម្ងាត់របស់អ្នក។" : "You are responsible for maintaining the security of your account and password."}</li>
              <li>{km ? "មនុស្សម្នាក់មិនអាចដំណើរការគណនីច្រើនដោយគ្មានការអនុញ្ញាតជាលាយលក្ខណ៍អក្សរទុកជាមុន។" : "One person may not operate multiple accounts without prior written permission."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៣. ទំនួលខុសត្រូវរបស់អ្នកទិញ" : "3. Buyer Responsibilities"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{km ? "អ្នកទិញទទួលខុសត្រូវក្នុងការអានការពិពណ៌នាផលិតផលឱ្យបានដិតដល់មុនពេលទិញ។" : "Buyers are responsible for reading product descriptions carefully before purchasing."}</li>
              <li>{km ? "អ្នកទិញត្រូវផ្ដល់អាសយដ្ឋានដឹកជញ្ជូន និងព័ត៌មានទំនាក់ទំនងត្រឹមត្រូវ។" : "Buyers must provide accurate delivery addresses and contact information."}</li>
              <li>{km ? "វិវាទជាមួយអ្នកលក់គួរតែព្យាយាមដោះស្រាយដោយផ្ទាល់ជាមួយអ្នកលក់ជាមុន។ CamCart អាចធ្វើជាអន្តរការ ប៉ុន្តែមិនទទួលខុសត្រូវចំពោះវិវាទ។" : "Disputes with vendors should first be attempted to be resolved directly with the vendor. CamCart may mediate but is not liable for vendor-buyer disputes."}</li>
              <li>{km ? "ការដកប្រាក់ក្លែងបន្លំ ឬការប្ដឹងមិនពិតអាចបណ្ដាលឱ្យព្យួរគណនី។" : "Fraudulent chargebacks or false claims may result in account suspension."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៤. ទំនួលខុសត្រូវរបស់អ្នកលក់" : "4. Vendor Responsibilities"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{km ? "អ្នកលក់ត្រូវផ្ដល់ការពិពណ៌នាផលិតផល តម្លៃ និងព័ត៌មានស្ដុកត្រឹមត្រូវ។" : "Vendors must provide accurate product descriptions, pricing, and stock information."}</li>
              <li>{km ? "អ្នកលក់ទទួលខុសត្រូវទាំងស្រុងចំពោះគុណភាព សុវត្ថិភាព និងភាពស្របច្បាប់នៃផលិតផលដែលលក់។" : "Vendors are solely responsible for the quality, safety, and legality of products they sell."}</li>
              <li>{km ? "អ្នកលក់ត្រូវបំពេញការបញ្ជាទិញក្នុងរយៈពេលដំណើរការដែលបានបញ្ជាក់។" : "Vendors must fulfil orders within the stated processing time."}</li>
              <li>{km ? "អ្នកលក់មិនអាចដាក់បញ្ជីផលិតផលក្លែងក្លាយ ហាមឃាត់ ឬខុសច្បាប់ឡើយ។" : "Vendors may not list counterfeit, prohibited, or illegal products."}</li>
              <li>{km ? "CamCart រក្សាសិទ្ធិក្នុងការដកបញ្ជីណាមួយដែលល្មើសនឹងលក្ខខណ្ឌទាំងនេះដោយគ្មានការជូនដំណឹង។" : "CamCart reserves the right to remove any listing that violates these terms without notice."}</li>
              <li>{km ? "អ្នកលក់យល់ព្រមចំពោះរចនាសម្ព័ន្ធកម្រៃជើងសា CamCart ដូចបានបញ្ជាក់នៅពេលចុះឈ្មោះ។" : "Vendors agree to CamCart's commission structure as outlined at the time of registration."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៥. សកម្មភាពហាមឃាត់" : "5. Prohibited Activities"}</h2>
            <p className="mb-2">{km ? "ដូចខាងក្រោមនេះត្រូវបានហាមឃាត់យ៉ាងតឹងរ៉ឹងនៅ CamCart៖" : "The following are strictly prohibited on CamCart:"}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{km ? "លក់ទំនិញក្លែងក្លាយ លួច ឬខុសច្បាប់។" : "Selling counterfeit, stolen, or illegal goods."}</li>
              <li>{km ? "ការបៀតបៀន ការគំរាមកំហែង ឬឥរិយាបថអាក្រក់ចំពោះអ្នកប្រើប្រាស់ផ្សេងទៀត។" : "Harassment, threats, or abusive behaviour toward other users."}</li>
              <li>{km ? "ការរៀបចំមតិ ឬការវាយតម្លៃ។" : "Manipulating reviews or ratings."}</li>
              <li>{km ? "ការប្រើវេទិកាដើម្បីធ្វើប្រតិបត្តិការក្រៅ CamCart ដើម្បីជៀសវាងថ្លៃ។" : "Using the platform to conduct transactions outside of CamCart to avoid fees."}</li>
              <li>{km ? "ការព្យាយាម hack ស្ទូច ឬរំខានវេទិកា។" : "Attempting to hack, scrape, or disrupt the Platform."}</li>
              <li>{km ? "ការក្លែងបន្លំជាបុគ្គល ឬអាជីវកម្មមួយទៀត។" : "Impersonating another person or business."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៦. ការទូទាត់" : "6. Payments"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{km ? "តម្លៃទាំងអស់ត្រូវបានបង្ហាញជារៀល (KHR) ឬដុល្លារ (USD) ដូចបានបង្ហាញ។" : "All prices are listed in Cambodian Riel (KHR) or US Dollar (USD) as displayed."}</li>
              <li>{km ? "ការទូទាត់ត្រូវបានដំណើរការយ៉ាងមានសុវត្ថិភាពតាមរយៈដៃគូទូទាត់របស់យើង។" : "Payment is processed securely through our payment partners."}</li>
              <li>{km ? "CamCart មិនទទួលខុសត្រូវចំពោះកំហុសដំណើរការការទូទាត់ដែលបណ្ដាលមកពីអ្នកផ្ដល់ការទូទាត់ភាគីទីបី។" : "CamCart is not responsible for payment processing errors caused by third-party payment providers."}</li>
              <li>{km ? "ការទូទាត់ប្រាក់ឱ្យអ្នកលក់ត្រូវបានដំណើរការស្របតាមកាលវិភាគដែលបានបង្ហាញក្នុងផ្ទាំងគ្រប់គ្រងអ្នកលក់។" : "Vendor payouts are processed according to the payout schedule shown in the Vendor Dashboard."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៧. ការប្រគល់ និងការសងប្រាក់វិញ" : "7. Returns and Refunds"}</h2>
            <p>
              {km
                ? "គោលការណ៍ប្រគល់ និងការសងប្រាក់វិញត្រូវបានកំណត់ដោយអ្នកលក់ម្នាក់ៗ។ អ្នកទិញគួរពិនិត្យគោលការណ៍ប្រគល់របស់អ្នកលក់មុនទិញ។ CamCart អាចជ្រៀតជ្រែបណ្ដោះអាសន្នក្នុងករណីដែលអ្នកលក់បរាជ័យក្នុងការអនុវត្តគោលការណ៍ប្រគល់ដែលបានបញ្ជាក់ច្បាស់លាស់ ហើយការសម្រេចចិត្តរបស់ CamCart ក្នុងវិវាទបែបនោះ ជាការសម្រេចចុងក្រោយ។"
                : "Return and refund policies are set by individual vendors. Buyers should review a vendor's return policy before purchasing. CamCart may intervene in disputes where a vendor fails to honour a clearly stated return policy. CamCart's decision in such disputes is final."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៨. កម្មសិទ្ធិបញ្ញា" : "8. Intellectual Property"}</h2>
            <p>
              {km
                ? "មាតិកាទាំងអស់នៅ CamCart — រួមមាន logo រចនាប័ទ្ម កូដ និងអត្ថបទ — គឺជាកម្មសិទ្ធិរបស់ CamCart និងត្រូវបានការពារក្រោមច្បាប់ដែលអាចអនុវត្ត។ អ្នកលក់រក្សាកម្មសិទ្ធិរូបភាពផលិតផល និងការពិពណ៌នារបស់ពួកគេ ប៉ុន្តែផ្ដល់ CamCart អាជ្ញាប័ណ្ណដើម្បីបង្ហាញពួកវានៅលើវេទិកា។"
                : "All content on CamCart — including the logo, design, code, and text — is owned by CamCart and protected under applicable law. Vendors retain ownership of their product images and descriptions but grant CamCart a licence to display them on the Platform."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៩. ការកំណត់ទំនួលខុសត្រូវ" : "9. Limitation of Liability"}</h2>
            <p>
              {km
                ? "CamCart គឺជាវេទិកាទីផ្សារ។ យើងមិនមែនជាភាគីក្នុងប្រតិបត្តិការរវាងអ្នកទិញ និងអ្នកលក់ទេ។ ក្នុងកម្រិតអតិបរមាដែលអនុញ្ញាតដោយច្បាប់ CamCart មិនទទួលខុសត្រូវចំពោះការខូចខាតណាមួយដែលកើតចេញពីប្រតិបត្តិការដែលបានធ្វើនៅលើវេទិកា រួមមានគុណភាពផលិតផល ការបរាជ័យក្នុងការដឹកជញ្ជូន ឬការប្រព្រឹត្តរបស់អ្នកលក់ខុស។"
                : "CamCart is a marketplace platform. We are not a party to transactions between buyers and vendors. To the maximum extent permitted by law, CamCart is not liable for any direct, indirect, or consequential damages arising from transactions conducted on the Platform, including product defects, delivery failures, or vendor misconduct."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១០. ការព្យួរ និងបញ្ចប់គណនី" : "10. Account Suspension & Termination"}</h2>
            <p>
              {km
                ? "CamCart រក្សាសិទ្ធិក្នុងការព្យួរ ឬបញ្ចប់គណនីណាមួយដែលល្មើសនឹងលក្ខខណ្ឌនៃការប្រើប្រាស់ ចូលរួមក្នុងសកម្មភាពក្លែងបន្លំ ឬបង្កហានិភ័យដល់វេទិកា ឬអ្នកប្រើប្រាស់ របស់វា។ អ្នកប្រើប្រាស់ក៏អាចបិទគណនីផ្ទាល់ខ្លួននៅពេលណាក៏បាន ដោយទំនាក់ទំនងផ្នែកជំនួយ។"
                : "CamCart reserves the right to suspend or permanently terminate any account that violates these Terms of Service, engages in fraudulent activity, or poses a risk to the Platform or its users. Users may also close their own account at any time by contacting support."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១១. ការផ្លាស់ប្ដូរលក្ខខណ្ឌ" : "11. Changes to Terms"}</h2>
            <p>
              {km
                ? "យើងអាចកែប្រែលក្ខខណ្ឌនៃការប្រើប្រាស់ទាំងនេះនៅពេលណាក៏បាន។ ការបន្តប្រើ CamCart បន្ទាប់ពីការផ្លាស់ប្ដូរត្រូវបានបោះពុម្ភ ចាត់ទុកជាការទទួលយកលក្ខខណ្ឌថ្មី។ យើងនឹងជូនដំណឹងអ្នកប្រើប្រាស់អំពីការផ្លាស់ប្ដូរសំខាន់ៗតាមអ៊ីម៉ែល ឬការជូនដំណឹងច្បាស់លាស់នៅលើវេទិកា។"
                : "We may modify these Terms of Service at any time. Continued use of CamCart after changes are posted constitutes your acceptance of the new terms. We will notify users of material changes via email or a prominent notice on the Platform."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១២. ច្បាប់គ្រប់គ្រង" : "12. Governing Law"}</h2>
            <p>
              {km
                ? "លក្ខខណ្ឌនៃការប្រើប្រាស់ទាំងនេះត្រូវបានគ្រប់គ្រងដោយច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។ វិវាទណាមួយត្រូវស្ថិតក្រោមយុត្តាធិការផ្តាច់មុខរបស់តុលាការ នៅភ្នំពេញ ប្រទេសកម្ពុជា។"
                : "These Terms of Service are governed by the laws of the Kingdom of Cambodia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Phnom Penh, Cambodia."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១៣. ទំនាក់ទំនងយើង" : "13. Contact Us"}</h2>
            <p>{km ? "សម្រាប់សំណួរអំពីលក្ខខណ្ឌទាំងនេះ សូមទំនាក់ទំនងយើង៖" : "For questions about these Terms, please contact us:"}</p>
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
