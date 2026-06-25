const translations = {
  en: {
    // Nav
    nav_dashboard:   "Dashboard",
    nav_payouts:     "Payouts",
    nav_vendors:     "Vendors",
    nav_users:       "Users",
    nav_products:    "Products",
    nav_categories:  "Categories",
    nav_coupons:     "Coupons",
    nav_mail:        "Mail",
    nav_settings:    "Settings",
    nav_sign_out:    "Sign Out",
    nav_admin_portal:"Admin Portal",

    // Settings cards
    set_admin_profile:    "Admin Profile",
    set_website:          "Website",
    set_bakong:           "Bakong Account",
    set_appearance:       "Appearance",
    set_appearance_sub:   "Theme and language preferences",
    set_theme:            "Theme",
    set_theme_light:      "Light",
    set_theme_dark:       "Dark",
    set_theme_system:     "System",
    set_language:         "Language",
    set_edit_profile:     "Edit Profile",
    set_edit_profile_sub: "Update your name, username and Gmail",
    set_name:             "Name",
    set_username:         "Username",
    set_gmail:            "Gmail",
    set_gmail_note:       "(mail sender — for reference)",
    set_save_profile:     "Save Profile",
    set_saving:           "Saving…",
    set_change_password:  "Change Password",
    set_change_pwd_sub:   "Update your sign-in password",
    set_current_pwd:      "Current Password",
    set_new_pwd:          "New Password",
    set_new_pwd_ph:       "Min 8 characters",
    set_confirm_pwd:      "Confirm New Password",
    set_forgot_pwd:       "Forgot password?",
    set_sending:          "Sending…",
    set_platform:         "Platform Info",
    set_platform_name:    "Platform",
    set_backend:          "Backend",
    set_frontend:         "Frontend",

    // Profile
    profile_name:     "Name",
    profile_username: "Username",
    profile_gmail:    "Gmail",

    // Dashboard page titles
    page_dashboard:   "Dashboard",
    page_payouts:     "Payouts",
    page_vendors:     "Vendors",
    page_users:       "Users",
    page_products:    "Products",
    page_categories:  "Categories",
    page_coupons:     "Coupons",
    page_mail:        "Mail",
    page_settings:    "Settings",
  },

  km: {
    // Nav
    nav_dashboard:   "ផ្ទាំងគ្រប់គ្រង",
    nav_payouts:     "ការទូទាត់",
    nav_vendors:     "អ្នកលក់",
    nav_users:       "អ្នកប្រើប្រាស់",
    nav_products:    "ផលិតផល",
    nav_categories:  "ប្រភេទ",
    nav_coupons:     "គូប៉ុង",
    nav_mail:        "អ៊ីមែល",
    nav_settings:    "ការកំណត់",
    nav_sign_out:    "ចាកចេញ",
    nav_admin_portal:"វិបផតថលអ្នកគ្រប់គ្រង",

    // Settings cards
    set_admin_profile:    "ប្រវត្តិរូបអ្នកគ្រប់គ្រង",
    set_website:          "គេហទំព័រ",
    set_bakong:           "គណនីបាគង",
    set_appearance:       "រូបរាង",
    set_appearance_sub:   "ការកំណត់រូបរាង និងភាសា",
    set_theme:            "រចនាបថ",
    set_theme_light:      "ភ្លឺ",
    set_theme_dark:       "ងងឹត",
    set_theme_system:     "ប្រព័ន្ធ",
    set_language:         "ភាសា",
    set_edit_profile:     "កែប្រវត្តិរូប",
    set_edit_profile_sub: "កែឈ្មោះ ឈ្មោះអ្នកប្រើ និង Gmail",
    set_name:             "ឈ្មោះ",
    set_username:         "ឈ្មោះអ្នកប្រើ",
    set_gmail:            "Gmail",
    set_gmail_note:       "(អ្នកផ្ញើអ៊ីមែល — សម្រាប់យោង)",
    set_save_profile:     "រក្សាទុកប្រវត្តិរូប",
    set_saving:           "កំពុងរក្សាទុក…",
    set_change_password:  "ផ្លាស់ប្ដូរពាក្យសម្ងាត់",
    set_change_pwd_sub:   "ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់",
    set_current_pwd:      "ពាក្យសម្ងាត់បច្ចុប្បន្ន",
    set_new_pwd:          "ពាក្យសម្ងាត់ថ្មី",
    set_new_pwd_ph:       "យ៉ាងតិច ៨ តួអក្សរ",
    set_confirm_pwd:      "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី",
    set_forgot_pwd:       "ភ្លេចពាក្យសម្ងាត់?",
    set_sending:          "កំពុងផ្ញើ…",
    set_platform:         "ព័ត៌មានប្លាតហ្វម",
    set_platform_name:    "ប្លាតហ្វម",
    set_backend:          "ប្រព័ន្ធខាងក្រោយ",
    set_frontend:         "ប្រព័ន្ធខាងមុខ",

    // Profile
    profile_name:     "ឈ្មោះ",
    profile_username: "ឈ្មោះអ្នកប្រើ",
    profile_gmail:    "Gmail",

    // Dashboard page titles
    page_dashboard:   "ផ្ទាំងគ្រប់គ្រង",
    page_payouts:     "ការទូទាត់",
    page_vendors:     "អ្នកលក់",
    page_users:       "អ្នកប្រើប្រាស់",
    page_products:    "ផលិតផល",
    page_categories:  "ប្រភេទ",
    page_coupons:     "គូប៉ុង",
    page_mail:        "អ៊ីមែល",
    page_settings:    "ការកំណត់",
  },
} as const;

export type Lang = keyof typeof translations;
export type TKey = keyof typeof translations["en"];

export function t(lang: Lang, key: TKey): string {
  return (translations[lang] as Record<string, string>)[key]
    ?? (translations["en"] as Record<string, string>)[key]
    ?? key;
}

export default translations;
