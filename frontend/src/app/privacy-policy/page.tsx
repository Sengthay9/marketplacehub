"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useLangStore } from "@/store/lang.store";

export default function PrivacyPolicyPage() {
  const { lang } = useLangStore();
  const km = lang === "km";

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <nav className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground transition">{km ? "ទំព័រដើម" : "Home"}</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{km ? "គោលការណ៍ភាពឯកជន" : "Privacy Policy"}</span>
        </nav>
        <h1 className="text-4xl font-bold mb-2">{km ? "គោលការណ៍ភាពឯកជន" : "Privacy Policy"}</h1>
        <p className="text-muted-foreground mb-10">{km ? "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖ ២៧ មិថុនា ២០២៦" : "Last updated: June 27, 2026"}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១. សេចក្ដីណែនាំ" : "1. Introduction"}</h2>
            <p>
              {km
                ? <>សូមស្វាគមន៍មកកាន់ CamCart ("យើង", "ពួកយើង")។ យើងជាទីផ្សារអ្នកលក់ច្រើនឈានមុខគេនៅកម្ពុជា ដែលភ្ជាប់អ្នកទិញជាមួយអ្នកលក់ដែលទុកចិត្តបាន។ គោលការណ៍ភាពឯកជននេះពន្យល់ពីរបៀបដែលយើងប្រមូល ប្រើប្រាស់ ចែករំលែក និងការពារព័ត៌មានផ្ទាល់ខ្លួនរបស់អ្នក នៅពេលអ្នកប្រើប្រាស់គេហទំព័ររបស់យើងនៅ <strong>camcart.shop</strong> និងសេវាកម្មពាក់ព័ន្ធ។</>
                : <>Welcome to CamCart ("we", "us", or "our"). We are Cambodia's leading multi-vendor marketplace connecting buyers with trusted sellers. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website at <strong>camcart.shop</strong> and related services.</>
              }
            </p>
            <p className="mt-2">
              {km
                ? "តាមរយៈការប្រើប្រាស់ CamCart អ្នកយល់ព្រមចំពោះការប្រមូល និងប្រើប្រាស់ព័ត៌មានស្របតាមគោលការណ៍នេះ។ ប្រសិនបើអ្នកមិនយល់ព្រម សូមមេត្តាកុំប្រើប្រាស់វេទិការបស់យើង។"
                : "By using CamCart, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our platform."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "២. ព័ត៌មានដែលយើងប្រមូល" : "2. Information We Collect"}</h2>
            <p className="mb-2">{km ? "យើងប្រមូលព័ត៌មានប្រភេទដូចខាងក្រោម៖" : "We collect the following types of information:"}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{km ? "ព័ត៌មានគណនី៖" : "Account Information:"}</strong> {km ? "ឈ្មោះ អាសយដ្ឋានអ៊ីម៉ែល លេខទូរស័ព្ទ និងពាក្យសម្ងាត់នៅពេលចុះឈ្មោះ។" : "Name, email address, phone number, and password when you register."}</li>
              <li><strong>{km ? "ព័ត៌មានប្រវត្តិរូប៖" : "Profile Information:"}</strong> {km ? "រូបភាពប្រវត្តិរូប អាសយដ្ឋានដឹកជញ្ជូន និងចំណូលចិត្តដែលអ្នកផ្ដល់។" : "Profile photo, delivery address, and preferences you provide."}</li>
              <li><strong>{km ? "ទិន្នន័យប្រតិបត្តិការ៖" : "Transaction Data:"}</strong> {km ? "ការបញ្ជាទិញ ផលិតផលដែលទិញ វិធីបង់ប្រាក់ (យើងមិនរក្សាទុកលេខកាតពេញ) និងប្រវត្តិប្រតិបត្តិការ។" : "Orders placed, products purchased, payment method (we do not store full card numbers), and transaction history."}</li>
              <li><strong>{km ? "ព័ត៌មានអ្នកលក់៖" : "Vendor Information:"}</strong> {km ? "ឈ្មោះអាជីវកម្ម ការពិពណ៌នាហាង បញ្ជីផលិតផល និងព័ត៌មានការទូទាត់សម្រាប់អ្នកលក់។" : "Business name, shop description, product listings, and payout details for vendors."}</li>
              <li><strong>{km ? "ទិន្នន័យឧបករណ៍ និងការប្រើប្រាស់៖" : "Device & Usage Data:"}</strong> {km ? "អាសយដ្ឋាន IP ប្រភេទកម្មវិធីរុករក ទំព័រដែលបានចូលមើល ពេលវេលាដែលចំណាយ និង URL យោង ប្រមូលដោយស្វ័យប្រវត្តិ។" : "IP address, browser type, pages visited, time spent, and referring URLs collected automatically."}</li>
              <li><strong>{km ? "ការទំនាក់ទំនង៖" : "Communications:"}</strong> {km ? "សារដែលអ្នកផ្ញើទៅអ្នកលក់ ឬក្រុមការងារជំនួយរបស់យើង។" : "Messages you send to vendors or our support team."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៣. របៀបដែលយើងប្រើប្រាស់ព័ត៌មានរបស់អ្នក" : "3. How We Use Your Information"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{km ? "ដើម្បីបង្កើត និងគ្រប់គ្រងគណនីរបស់អ្នក។" : "To create and manage your account."}</li>
              <li>{km ? "ដើម្បីដំណើរការការបញ្ជាទិញ ការទូទាត់ និងការដឹកជញ្ជូន។" : "To process orders, payments, and deliveries."}</li>
              <li>{km ? "ដើម្បីភ្ជាប់អ្នកទិញជាមួយអ្នកលក់ និងសម្រួលប្រតិបត្តិការ។" : "To connect buyers with vendors and facilitate transactions."}</li>
              <li>{km ? "ដើម្បីផ្ញើការបញ្ជាក់ការបញ្ជាទិញ វិក្កយបត្រ និងព័ត៌មានអំពីការដឹកជញ្ជូន។" : "To send order confirmations, receipts, and shipping updates."}</li>
              <li>{km ? "ដើម្បីផ្ញើអ៊ីម៉ែលផ្សព្វផ្សាយ និងការផ្ដល់ជូន (អ្នកអាចបដិសេធនៅពេលណាក៏បាន)។" : "To send promotional emails and offers (you may opt out at any time)."}</li>
              <li>{km ? "ដើម្បីកែលម្អវេទិការបស់យើង រកឃើញការក្លែងបន្លំ និងធានាសុវត្ថិភាព។" : "To improve our platform, detect fraud, and ensure security."}</li>
              <li>{km ? "ដើម្បីអនុលោមតាមកាតព្វកិច្ចច្បាប់នៅក្រោមច្បាប់កម្ពុជា។" : "To comply with legal obligations under Cambodian law."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៤. ការចែករំលែកព័ត៌មានរបស់អ្នក" : "4. Sharing Your Information"}</h2>
            <p className="mb-2">{km ? "យើងមិនលក់ទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នកទេ។ យើងអាចចែករំលែកវាជាមួយ៖" : "We do not sell your personal data. We may share it with:"}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{km ? "អ្នកលក់៖" : "Vendors:"}</strong> {km ? "នៅពេលអ្នកដាក់ការបញ្ជាទិញ អ្នកលក់ទទួលឈ្មោះ អាសយដ្ឋានដឹកជញ្ជូន និងលេខទូរស័ព្ទរបស់អ្នក ដើម្បីបំពេញការបញ្ជាទិញ។" : "When you place an order, the vendor receives your name, delivery address, and phone number to fulfil it."}</li>
              <li><strong>{km ? "ក្រុមហ៊ុនដំណើរការការទូទាត់៖" : "Payment Processors:"}</strong> {km ? "ដើម្បីដំណើរការប្រតិបត្តិការប្រកបដោយសុវត្ថិភាព។" : "To securely handle transactions."}</li>
              <li><strong>{km ? "អ្នកផ្ដល់សេវាកម្ម៖" : "Service Providers:"}</strong> {km ? "ភាគីទីបីដែលជួយយើងដំណើរការវេទិកា (ការបង្ហោះ វិភាគ ការដឹកជញ្ជូនអ៊ីម៉ែល) ក្រោមកិច្ចព្រមព្រៀងសម្ងាត់តឹងរ៉ឹង។" : "Third parties that help us operate the platform (hosting, analytics, email delivery) under strict confidentiality agreements."}</li>
              <li><strong>{km ? "អាជ្ញាធរច្បាប់៖" : "Legal Authorities:"}</strong> {km ? "នៅពេលតម្រូវដោយច្បាប់កម្ពុជា បញ្ជារបស់តុលាការ ឬដើម្បីការពារសុវត្ថិភាពអ្នកប្រើប្រាស់របស់យើង។" : "When required by Cambodian law, court order, or to protect the safety of our users."}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៥. ការរក្សាទុកទិន្នន័យ" : "5. Data Retention"}</h2>
            <p>
              {km
                ? <>យើងរក្សាទុកទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នករហូតដល់គណនីរបស់អ្នកសកម្ម ឬតាមការចាំបាច់ដើម្បីផ្ដល់សេវាកម្ម។ អ្នកអាចស្នើសុំលុបគណនី និងទិន្នន័យពាក់ព័ន្ធនៅពេលណាក៏បានដោយទំនាក់ទំនងយើងតាម <strong>hello@camcart.shop</strong>។</>
                : <>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us at <strong>hello@camcart.shop</strong>.</>
              }
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៦. សិទ្ធិរបស់អ្នក" : "6. Your Rights"}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>{km ? "ការចូលប្រើ៖" : "Access:"}</strong> {km ? "ស្នើសុំច្បាប់ចម្លងនៃទិន្នន័យផ្ទាល់ខ្លួនដែលយើងមានអំពីអ្នក។" : "Request a copy of the personal data we hold about you."}</li>
              <li><strong>{km ? "ការកែតម្រូវ៖" : "Correction:"}</strong> {km ? "ធ្វើបច្ចុប្បន្នភាពព័ត៌មានមិនត្រឹមត្រូវ ឬមិនពេញលេញតាមរយៈការកំណត់គណនីរបស់អ្នក។" : "Update inaccurate or incomplete information via your account settings."}</li>
              <li><strong>{km ? "ការលុប៖" : "Deletion:"}</strong> {km ? "ស្នើសុំឱ្យយើងលុបទិន្នន័យផ្ទាល់ខ្លួនរបស់អ្នក។" : "Request that we delete your personal data."}</li>
              <li><strong>{km ? "ការបដិសេធ៖" : "Opt-out:"}</strong> {km ? "លុបការជាវអ៊ីម៉ែលទីផ្សារនៅពេលណាក៏បាន។" : "Unsubscribe from marketing emails at any time."}</li>
            </ul>
            <p className="mt-2">{km ? <>ដើម្បីប្រើប្រាស់សិទ្ធិទាំងនេះ សូមផ្ញើអ៊ីម៉ែលមកយើងនៅ <strong>hello@camcart.shop</strong>។</> : <>To exercise these rights, email us at <strong>hello@camcart.shop</strong>.</>}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៧. សុវត្ថិភាព" : "7. Security"}</h2>
            <p>
              {km
                ? "យើងអនុវត្តវិធានការសុវត្ថិភាពស្ដង់ដារឧស្សាហកម្ម រួមមានការអ៊ិនគ្រីប HTTPS ការ hash ពាក្យសម្ងាត់ប្រកបដោយសុវត្ថិភាព និងការគ្រប់គ្រងការចូលប្រើ។ ទោះយ៉ាងណា គ្មានវិធីសាស្ត្របញ្ជូនតាមអ៊ីនធឺណិតណាដែលមានសុវត្ថិភាព ១០០% ឡើយ។ យើងលើកទឹកចិត្តអ្នកឱ្យប្រើពាក្យសម្ងាត់ខ្លាំង និងរក្សាព័ត៌មានបញ្ជូលគណនីរបស់អ្នកឱ្យជាសម្ងាត់។"
                : "We implement industry-standard security measures including HTTPS encryption, secure password hashing, and access controls. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong password and keep your account credentials confidential."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៨. ភាពឯកជនរបស់កុមារ" : "8. Children's Privacy"}</h2>
            <p>
              {km
                ? "CamCart មិនត្រូវបានបម្រុងទុកសម្រាប់អ្នកប្រើប្រាស់ដែលមានអាយុក្រោម ១៨ ឆ្នាំឡើយ។ យើងមិនប្រមូលទិន្នន័យផ្ទាល់ខ្លួនពីអនីតិជនដោយចេតនាទេ។ ប្រសិនបើអ្នកជឿថាកុមារម្នាក់បានផ្ដល់ព័ត៌មានផ្ទាល់ខ្លួនដល់យើង សូមទំនាក់ទំនងយើងភ្លាមៗ។"
                : "CamCart is not intended for users under the age of 18. We do not knowingly collect personal data from minors. If you believe a child has provided us with personal information, please contact us immediately."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "៩. ការផ្លាស់ប្ដូរគោលការណ៍នេះ" : "9. Changes to This Policy"}</h2>
            <p>
              {km
                ? "យើងអាចធ្វើបច្ចុប្បន្នភាពគោលការណ៍ភាពឯកជននេះពីមួយពេលទៅមួយពេល។ យើងនឹងជូនដំណឹងអ្នកអំពីការផ្លាស់ប្ដូរសំខាន់ៗដោយការបោះពុម្ភគោលការណ៍ថ្មីនៅលើទំព័រនេះជាមួយកាលបរិច្ឆេទដែលបានធ្វើបច្ចុប្បន្នភាព។ ការបន្តប្រើ CamCart បន្ទាប់ពីការផ្លាស់ប្ដូរ ចាត់ទុកជាការទទួលយកគោលការណ៍ដែលបានធ្វើបច្ចុប្បន្នភាព។"
                : "We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date. Continued use of CamCart after changes constitutes acceptance of the updated policy."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3">{km ? "១០. ទំនាក់ទំនងយើង" : "10. Contact Us"}</h2>
            <p>{km ? "ប្រសិនបើអ្នកមានសំណួរអំពីគោលការណ៍ភាពឯកជននេះ សូមទំនាក់ទំនងយើង៖" : "If you have any questions about this Privacy Policy, please contact us:"}</p>
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
