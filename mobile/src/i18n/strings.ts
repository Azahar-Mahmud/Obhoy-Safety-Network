export const en = {
  // ---- common ----
  'common.cancel': 'Cancel',
  'common.confirm': 'Confirm',
  'common.save': 'Save',
  'common.done': 'Done',
  'common.skip': 'Skip',
  'common.add': 'Add',
  'common.delete': 'Delete',
  'common.back': 'Back',
  'common.ok': 'OK',
  'common.error': 'Something went wrong',
  'common.retry': 'Try again',

  // ---- language picker ----
  'lang.title': 'Choose your language',
  'lang.subtitle': 'You can change this later in Settings.',
  'lang.setting_label': 'Language',
  'lang.setting_note': 'This also sets the language of alerts sent to your trusted contacts.',

  // ---- auth ----
  'auth.phone_title': 'Enter your phone number',
  'auth.phone_placeholder': '01XXXXXXXXX',
  'auth.continue': 'Continue',
  'auth.otp_title': 'Enter the code we sent you',
  'auth.otp_skip': 'Set a PIN instead and continue',
  'auth.set_pin_title': 'Set a PIN',
  'auth.set_pin_hint': 'You will use this to log in, and to unlock the app in Discreet Mode.',
  'auth.login_pin_title': 'Enter your PIN',
  'auth.logout': 'Log out',

  // ---- home ----
  'home.sos': 'SOS',
  'home.sos_hint_silent': 'Press and hold',
  'home.i_am_safe': 'I Am Safe',
  'home.contacts': 'Trusted Contacts',
  'home.journey': 'Jatri Mode',
  'home.map': 'Map',
  'home.directory': 'Emergency Numbers',
  'home.nearby_alerts': 'Nearby Alerts',
  'home.settings': 'Settings',
  'home.evidence': 'Record',

  // ---- SOS ----
  'sos.countdown': 'Sending SOS in {{seconds}}',
  'sos.sent_title': 'Alert sent',
  'sos.channel_backend': 'Sent via internet',
  'sos.channel_native': 'Sent directly by SMS (no internet available)',
  'sos.channel_lan': 'Could not reach your contacts by SMS. Broadcast to nearby Obhoy users over WiFi.',
  'sos.channel_mesh': 'Could not reach your contacts by SMS or WiFi. Broadcast to nearby Obhoy users over Bluetooth.',
  'sos.channel_failed': 'Could not be sent',
  'sos.call_contact': 'Call {{name}}',
  'sos.last_alert_title': 'Last Alert',
  'sos.last_alert_none': 'No alerts sent yet',
  'sos.last_alert_at': 'Sent {{time}}',

  // ---- SMS / broadcast bodies (mobile side, Layers 2-4) ----
  'msg.sos_body': 'Obhoy Alert: I need help. My location: {{link}}',
  'msg.sos_broadcast': 'Obhoy Alert: someone nearby needs help.',
  'msg.safe_checkin': 'Obhoy: someone nearby checked in as safe.',
  'msg.community_alert': 'Obhoy: anonymous alert — {{category}} reported nearby.',
  'msg.battery_body': 'Obhoy Auto-Alert: phone battery low. Last known location: {{link}}',

  // ---- journey ----
  'journey.setup_title': 'Where are you going?',
  'journey.destination_placeholder': 'Home, campus, office...',
  'journey.checkin_interval': 'Check in every',
  'journey.minutes': '{{n}} min',
  'journey.mode_interval': 'Recurring check-in',
  'journey.mode_scheduled': 'Confirm by a set time',
  'journey.deadline': 'Confirm safety by',
  'journey.start': 'Start Journey',
  'journey.arrived': 'I Arrived Safely',
  'journey.help': 'HELP',
  'journey.checkin_prompt': 'Are you okay?',
  'journey.im_safe': "I'm Safe",
  'journey.need_help': 'I Need Help',
  'journey.geofence_warning': 'You are outside your safe zone',
  'journey.danger_title': 'Reports nearby',
  'journey.danger_body': 'Several incidents have been reported near you recently.',
  'journey.view_on_map': 'View on Map',

  // ---- map & reporting ----
  'map.title': 'Map',
  'map.report_button': '+ Report',
  'map.warn_nearby': 'Warn Nearby',
  'map.confirm_report': 'Confirm this happened',
  'map.confirmed_by': 'Confirmed by {{n}}',
  'map.score_title': 'Area safety',
  'map.score_no_data': 'Not enough data',
  'map.score_safe': 'Generally safe',
  'map.score_caution': 'Be careful here',
  'map.score_danger': 'Several reports here',

  'category.mugging': 'Mugging',
  'category.harassment': 'Harassment',
  'category.checkpost_harassment': 'Checkpost harassment',
  'category.poor_lighting': 'Poor lighting',
  'category.safe_spot': 'Safe spot',

  'report.pick_category': 'What happened?',
  'report.confirm_location': 'Is this the right place?',
  'report.drag_hint': 'Drag the pin to adjust',
  'report.description': 'Add a note (optional)',
  'report.submitted': 'Thank you. Your report has been added.',

  // ---- contacts ----
  'contacts.title': 'Trusted Contacts',
  'contacts.empty': 'No contacts yet. Add up to 5 people who should be alerted.',
  'contacts.add_title': 'Add a contact',
  'contacts.name': 'Name',
  'contacts.phone': 'Phone number',
  'contacts.limit_reached': 'You can add up to 5 contacts.',

  // ---- emergency directory ----
  'dir.title': 'Emergency Numbers',
  'dir.police': 'Police',
  'dir.women_child': 'Women & Child Helpline',
  'dir.child': 'Child Helpline',
  'dir.disaster': 'Disaster Helpline',

  // ---- settings ----
  'settings.title': 'Settings',
  'settings.discreet': 'Discreet Mode',
  'settings.discreet_hint': 'Disguise the app as a calculator. Type your PIN and press = to unlock.',
  'settings.silent_sos': 'Silent SOS',
  'settings.silent_sos_hint': 'Press and hold SOS. Nothing appears on screen.',
  'settings.fall_detection': 'Fall Detection',
  'settings.sensitivity': 'Sensitivity',
  'settings.sensitivity_low': 'Low',
  'settings.sensitivity_medium': 'Medium',
  'settings.sensitivity_high': 'High',
  'settings.battery_alert': 'Battery Alert',
  'settings.battery_threshold': 'Alert below',
  'settings.auto_call': 'Call a contact after SOS',
  'settings.auto_call_hint': 'Never happens during Silent SOS.',
  'settings.medical_card': 'Medical Card',

  // ---- medical card ----
  'medical.title': 'Medical Emergency',
  'medical.blood_type': 'Blood type',
  'medical.allergies': 'Allergies',
  'medical.notes': 'Notes',
  'medical.contacts': 'Emergency contacts',

  // ---- fall detection ----
  'fall.title': 'Are you okay?',
  'fall.im_okay': "I'm Okay",
  'fall.countdown': 'Alerting your contacts in {{seconds}}',

  // ---- notifications ----
  'notif.checkin_title': 'Check-in',
  'notif.checkin_body': 'Tap to confirm you are safe.',
  'notif.checkin_title_discreet': 'Reminder',
  'notif.checkin_body_discreet': 'Tap to open.',
  'notif.nearby_title': 'Nearby Obhoy Alert',
  'notif.battery_title': 'Location sent',
  'notif.battery_body': 'Your battery is low, so your location was sent to your contacts.',
  'notif.deadline_title': 'Check-in due soon',
} as const;

export type StringKey = keyof typeof en;

export const bn: Partial<Record<StringKey, string>> = {
  // ---- common ----
  'common.cancel': 'বাতিল করুন',
  'common.confirm': 'নিশ্চিত করুন',
  'common.save': 'সংরক্ষণ করুন',
  'common.done': 'সম্পন্ন',
  'common.skip': 'এড়িয়ে যান',
  'common.add': 'যোগ করুন',
  'common.delete': 'মুছে ফেলুন',
  'common.back': 'পেছনে',
  'common.ok': 'ঠিক আছে',
  'common.error': 'কিছু একটা সমস্যা হয়েছে',
  'common.retry': 'আবার চেষ্টা করুন',

  // ---- language picker ----
  'lang.title': 'আপনার ভাষা নির্বাচন করুন',
  'lang.subtitle': 'পরে সেটিংস থেকে বদলাতে পারবেন।',
  'lang.setting_label': 'ভাষা',
  'lang.setting_note': 'আপনার বিশ্বস্ত পরিচিতিদের কাছে যাওয়া বার্তাও এই ভাষাতেই যাবে।',

  // ---- auth ----
  'auth.phone_title': 'আপনার ফোন নম্বর দিন',
  'auth.phone_placeholder': '01XXXXXXXXX',
  'auth.continue': 'এগিয়ে যান',
  'auth.otp_title': 'পাঠানো কোডটি দিন',
  'auth.otp_skip': 'কোড ছাড়াই পিন দিয়ে এগিয়ে যান',
  'auth.set_pin_title': 'একটি পিন সেট করুন',
  'auth.set_pin_hint': 'এই পিন দিয়েই লগ ইন করবেন, আর গোপন মোডে অ্যাপটি খুলবেন।',
  'auth.login_pin_title': 'আপনার পিন দিন',
  'auth.logout': 'লগ আউট',

  // ---- home ----
  'home.sos': 'SOS',
  'home.sos_hint_silent': 'চেপে ধরে রাখুন',
  'home.i_am_safe': 'আমি নিরাপদ আছি',
  'home.contacts': 'বিশ্বস্ত পরিচিতি',
  'home.journey': 'যাত্রী মোড',
  'home.map': 'মানচিত্র',
  'home.directory': 'জরুরি নম্বর',
  'home.nearby_alerts': 'কাছাকাছি সতর্কতা',
  'home.settings': 'সেটিংস',
  'home.evidence': 'রেকর্ড',

  // ---- SOS ----
  'sos.countdown': '{{seconds}} সেকেন্ড পরে SOS পাঠানো হবে',
  'sos.sent_title': 'বার্তা পাঠানো হয়েছে',
  'sos.channel_backend': 'ইন্টারনেটের মাধ্যমে পাঠানো হয়েছে',
  'sos.channel_native': 'সরাসরি এসএমএসে পাঠানো হয়েছে (ইন্টারনেট নেই)',
  'sos.channel_lan': 'এসএমএসে পরিচিতিদের কাছে পৌঁছানো যায়নি। ওয়াইফাইয়ে কাছাকাছি অভয় ব্যবহারকারীদের জানানো হয়েছে।',
  'sos.channel_mesh': 'এসএমএস বা ওয়াইফাইয়ে পৌঁছানো যায়নি। ব্লুটুথে কাছাকাছি অভয় ব্যবহারকারীদের জানানো হয়েছে।',
  'sos.channel_failed': 'পাঠানো যায়নি',
  'sos.call_contact': '{{name}}-কে কল করুন',
  'sos.last_alert_title': 'সর্বশেষ বার্তা',
  'sos.last_alert_none': 'এখনো কোনো বার্তা পাঠানো হয়নি',
  'sos.last_alert_at': '{{time}} পাঠানো হয়েছে',

  // ---- SMS / broadcast bodies (kept short: Bangla SMS = 70 chars per segment) ----
  'msg.sos_body': 'অভয়: আমি বিপদে আছি, তাড়াতাড়ি আসো। অবস্থান: {{link}}',
  'msg.sos_broadcast': 'অভয়: কাছাকাছি কারও সাহায্য দরকার।',
  'msg.safe_checkin': 'অভয়: কাছাকাছি কেউ নিরাপদ আছে জানিয়েছে।',
  'msg.community_alert': 'অভয়: কাছাকাছি {{category}} হয়েছে বলে জানানো হয়েছে।',
  'msg.battery_body': 'অভয়: ফোনের চার্জ শেষ হয়ে আসছে। শেষ অবস্থান: {{link}}',

  // ---- journey ----
  'journey.setup_title': 'আপনি কোথায় যাচ্ছেন?',
  'journey.destination_placeholder': 'বাসা, ক্যাম্পাস, অফিস...',
  'journey.checkin_interval': 'খবর দেওয়ার সময়সীমা',
  'journey.minutes': '{{n}} মিনিট',
  'journey.mode_interval': 'নিয়মিত খবর দেব',
  'journey.mode_scheduled': 'নির্ধারিত সময়ের মধ্যে জানাব',
  'journey.deadline': 'এই সময়ের মধ্যে নিরাপদ থাকার খবর দেব',
  'journey.start': 'যাত্রা শুরু করুন',
  'journey.arrived': 'আমি নিরাপদে পৌঁছেছি',
  'journey.help': 'সাহায্য',
  'journey.checkin_prompt': 'আপনি কি ঠিক আছেন?',
  'journey.im_safe': 'আমি নিরাপদ',
  'journey.need_help': 'আমার সাহায্য দরকার',
  'journey.geofence_warning': 'আপনি নিরাপদ এলাকার বাইরে চলে এসেছেন',
  'journey.danger_title': 'কাছাকাছি ঘটনার খবর',
  'journey.danger_body': 'সম্প্রতি আপনার আশেপাশে কয়েকটি ঘটনার খবর এসেছে।',
  'journey.view_on_map': 'মানচিত্রে দেখুন',

  // ---- map & reporting ----
  'map.title': 'মানচিত্র',
  'map.report_button': '+ ঘটনা জানান',
  'map.warn_nearby': 'কাছাকাছি সবাইকে সতর্ক করুন',
  'map.confirm_report': 'এটি ঘটেছে — নিশ্চিত করছি',
  'map.confirmed_by': '{{n}} জন নিশ্চিত করেছেন',
  'map.score_title': 'এলাকার নিরাপত্তা',
  'map.score_no_data': 'যথেষ্ট তথ্য নেই',
  'map.score_safe': 'সাধারণভাবে নিরাপদ',
  'map.score_caution': 'এখানে সাবধান থাকুন',
  'map.score_danger': 'এখানে একাধিক ঘটনার খবর আছে',

  'category.mugging': 'ছিনতাই',
  'category.harassment': 'হয়রানি',
  'category.checkpost_harassment': 'চেকপোস্টে হয়রানি',
  'category.poor_lighting': 'আলো কম',
  'category.safe_spot': 'নিরাপদ জায়গা',

  'report.pick_category': 'কী ঘটেছে?',
  'report.confirm_location': 'জায়গাটি কি ঠিক আছে?',
  'report.drag_hint': 'পিনটি টেনে ঠিক করুন',
  'report.description': 'কিছু লিখতে চাইলে লিখুন (ইচ্ছা হলে)',
  'report.submitted': 'ধন্যবাদ। আপনার তথ্য যোগ করা হয়েছে।',

  // ---- contacts ----
  'contacts.title': 'বিশ্বস্ত পরিচিতি',
  'contacts.empty': 'এখনো কেউ যোগ করা হয়নি। সর্বোচ্চ ৫ জনকে যোগ করতে পারবেন।',
  'contacts.add_title': 'নতুন পরিচিতি যোগ করুন',
  'contacts.name': 'নাম',
  'contacts.phone': 'ফোন নম্বর',
  'contacts.limit_reached': 'সর্বোচ্চ ৫ জনকে যোগ করা যাবে।',

  // ---- emergency directory ----
  'dir.title': 'জরুরি নম্বর',
  'dir.police': 'পুলিশ',
  'dir.women_child': 'নারী ও শিশু হেল্পলাইন',
  'dir.child': 'শিশু হেল্পলাইন',
  'dir.disaster': 'দুর্যোগ হেল্পলাইন',

  // ---- settings ----
  'settings.title': 'সেটিংস',
  'settings.discreet': 'গোপন মোড',
  'settings.discreet_hint': 'অ্যাপটি ক্যালকুলেটরের মতো দেখাবে। পিন লিখে = চাপলে আসল অ্যাপ খুলবে।',
  'settings.silent_sos': 'নীরব SOS',
  'settings.silent_sos_hint': 'SOS চেপে ধরে রাখুন। পর্দায় কিছুই দেখা যাবে না।',
  'settings.fall_detection': 'পড়ে যাওয়া শনাক্তকরণ',
  'settings.sensitivity': 'সংবেদনশীলতা',
  'settings.sensitivity_low': 'কম',
  'settings.sensitivity_medium': 'মাঝারি',
  'settings.sensitivity_high': 'বেশি',
  'settings.battery_alert': 'ব্যাটারি সতর্কতা',
  'settings.battery_threshold': 'এর নিচে নামলে জানাবে',
  'settings.auto_call': 'SOS-এর পর একজনকে কল করবে',
  'settings.auto_call_hint': 'নীরব SOS-এর সময় কখনোই কল করবে না।',
  'settings.medical_card': 'মেডিকেল কার্ড',

  // ---- medical card ----
  'medical.title': 'জরুরি চিকিৎসা তথ্য',
  'medical.blood_type': 'রক্তের গ্রুপ',
  'medical.allergies': 'অ্যালার্জি',
  'medical.notes': 'অন্যান্য তথ্য',
  'medical.contacts': 'জরুরি পরিচিতি',

  // ---- fall detection ----
  'fall.title': 'আপনি কি ঠিক আছেন?',
  'fall.im_okay': 'আমি ঠিক আছি',
  'fall.countdown': '{{seconds}} সেকেন্ড পরে পরিচিতিদের জানানো হবে',

  // ---- notifications ----
  'notif.checkin_title': 'খবর দিন',
  'notif.checkin_body': 'নিরাপদ আছেন জানাতে চাপ দিন।',
  'notif.checkin_title_discreet': 'রিমাইন্ডার',
  'notif.checkin_body_discreet': 'খুলতে চাপ দিন।',
  'notif.nearby_title': 'কাছাকাছি অভয় সতর্কতা',
  'notif.battery_title': 'অবস্থান পাঠানো হয়েছে',
  'notif.battery_body': 'চার্জ কম থাকায় আপনার অবস্থান পরিচিতিদের জানানো হয়েছে।',
  'notif.deadline_title': 'খবর দেওয়ার সময় হয়ে আসছে',
};