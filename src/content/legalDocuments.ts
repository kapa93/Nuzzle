export type LegalDocumentType = 'terms' | 'communityGuidelines' | 'privacyPolicy';

export type LegalDocument = {
  title: string;
  content: string;
};

export const LEGAL_DOCUMENTS: Record<LegalDocumentType, LegalDocument> = {
  terms: {
    title: 'Terms of Service',
    content: `# Terms of Service
---

## 1. Acceptance of Terms

By downloading, installing, or using the Nuzzle mobile application ("App," "Service," or "Nuzzle"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use Nuzzle.

We may update these Terms from time to time. We will notify you of material changes via in-app notice or email. Your continued use of the App after changes take effect constitutes your acceptance of the revised Terms.

---

## 2. Eligibility

You must be at least **13 years old** to use Nuzzle. By creating an account, you represent that you meet this age requirement. If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.

---

## 3. Account Registration

### 3.1 Creating an Account

You may register using an email address and password or via **Sign in with Apple**. You agree to provide accurate, current, and complete information during registration and to keep your account information up to date.

### 3.2 Account Security

You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to notify us immediately at **support@nuzzle.app** if you suspect unauthorized use of your account.

### 3.3 One Account per Person

You may create only one personal account. Creating multiple accounts to evade a suspension or ban is prohibited and may result in permanent removal from the platform.

---

## 4. The Nuzzle Service

Nuzzle provides a social community platform for dog breed enthusiasts, including:

- **Breed communities** — breed-specific feeds and discussion
- **Posts** — Questions, Updates/Stories, Tips, and Meetups with photos
- **Comments and reactions** on posts
- **Meetups** — create and RSVP to dog meetup events
- **Dog Beach Now** — real-time location-based check-ins at Ocean Beach Dog Beach, San Diego
- **Dog profiles** and **dog-to-dog interaction logs**
- **Search and discovery** across breeds, posts, and users
- **In-app notifications** for community activity

We reserve the right to modify, suspend, or discontinue any feature of the Service at any time, with or without notice.

---

## 5. User Content

### 5.1 Your Content

"User Content" means any text, photos, comments, reactions, dog profiles, meetup details, or other material you submit, post, or share through Nuzzle. You retain ownership of your User Content.

### 5.2 License to Nuzzle

By posting User Content, you grant Nuzzle a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, store, display, reproduce, and distribute your User Content solely for the purpose of operating and improving the Service. This license ends when you delete the content or your account, subject to the retention provisions in our Privacy Policy.

### 5.3 Your Responsibility

You are solely responsible for your User Content. You represent and warrant that:

- You own or have the necessary rights to post the content
- The content does not infringe any third-party intellectual property, privacy, or other rights
- The content complies with these Terms and our Community Guidelines

### 5.4 Content Removal

We reserve the right to remove any User Content that violates these Terms or our Community Guidelines, or that we determine in our sole discretion is harmful, offensive, or otherwise objectionable, without prior notice.

---

## 6. Prohibited Conduct

You agree not to:

- **Violate any law** — use Nuzzle for any unlawful purpose or in violation of any applicable local, state, national, or international law
- **Harass or harm others** — bully, harass, threaten, stalk, or intimidate any user or their dog(s)
- **Post prohibited content** — share content that is hateful, discriminatory, sexually explicit, graphically violent, or that promotes self-harm
- **Spam** — post repetitive, unsolicited, or promotional content; create fake accounts or automated bots
- **Impersonate** — falsely represent yourself as another person, user, or organization
- **Scrape or data-mine** — use automated tools to extract data from Nuzzle without our written permission
- **Interfere with the Service** — attempt to access systems or data you are not authorized to access; introduce malware; conduct denial-of-service attacks
- **Misuse the report system** — file false or bad-faith reports against other users
- **Violate animal welfare** — post content that depicts, encourages, or glorifies animal cruelty or abuse
- **Circumvent restrictions** — bypass account bans, content filters, or other technical measures

---

## 7. Dog Profiles and Interactions

Nuzzle allows you to create profiles for your dog(s) and log interactions between dogs. You represent that:

- You are the owner or an authorized caretaker of any dog you register
- The information you provide about your dog is accurate to the best of your knowledge
- You have the right to share photos of your dog

Dog interaction logs are social features intended to help owners remember dogs they have met. They are not a guarantee of compatibility or safety, and Nuzzle is not responsible for any outcomes arising from dog meetings arranged through or inspired by the app.

---

## 8. Meetups

Nuzzle enables users to organize and RSVP to dog meetup events. You acknowledge that:

- Nuzzle is a coordination platform only; we do not organize, sponsor, or supervise any meetup
- You attend any meetup at your own risk
- You are responsible for your own safety and the safety and behavior of your dog(s) at any meetup
- Nuzzle is not liable for any injury, property damage, or other harm occurring at or in connection with a meetup arranged through the app

---

## 9. Dog Beach Now
The Dog Beach Now feature uses your device's location to verify proximity to Ocean Beach Dog Beach in San Diego. By using this feature:


- You consent to the one-time location access required to verify proximity
- You represent that your check-in is genuine and that you or your dog are present at or near the location
- You agree not to submit false check-ins

---

## 10. Health Disclaimer

Some posts on Nuzzle may be tagged with a health-related topic. Nuzzle displays a health disclaimer on such posts. Content on Nuzzle is user-generated and is **not a substitute for professional veterinary advice, diagnosis, or treatment**. Always consult a licensed veterinarian for guidance regarding your dog's health. Nuzzle is not responsible for any harm arising from reliance on health-related content posted by users.

---

## 11. Intellectual Property

All rights in the Nuzzle application, including the name, logo, design, software, and original content created by Nuzzle, are owned by or licensed to us and are protected by applicable intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Service or its underlying software without our prior written consent.

---

## 12. Privacy

Your use of Nuzzle is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review the Privacy Policy to understand our practices.

---

## 13. Third-Party Services and Links

Nuzzle uses third-party services (including Supabase for infrastructure and Apple for authentication). Your use of those services is governed by their respective terms and policies. We are not responsible for the practices of any third-party service.

---

## 14. Termination

### 14.1 By You

You may stop using Nuzzle and delete your account at any time through the app settings.

### 14.2 By Nuzzle

We may suspend or terminate your account at any time, with or without notice, if we believe you have violated these Terms, our Community Guidelines, or applicable law, or if we determine that your conduct is harmful to other users or the community.

### 14.3 Effect of Termination

Upon termination, your right to use the Service ends immediately. Provisions of these Terms that by their nature should survive termination (including intellectual property rights, disclaimers, limitations of liability, and dispute resolution) will survive.

---

## 15. Disclaimers

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.

---

## 16. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NUZZLE AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRIOR TO THE CLAIM OR (B) ONE HUNDRED DOLLARS (USD $100).

---

## 17. Indemnification

You agree to indemnify, defend, and hold harmless Nuzzle and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or related to: (a) your use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any third-party rights.

---

## 18. Governing Law and Dispute Resolution

These Terms are governed by the laws of the State of California, without regard to its conflict-of-law principles. Any disputes arising under these Terms shall be resolved in the state or federal courts located in San Diego County, California, and you consent to personal jurisdiction in those courts.

---

## 19. Contact Us

If you have questions about these Terms, please contact us at:

**Nuzzle**
Email: **support@nuzzle.app**

---

© 2026 Nuzzle. All rights reserved.`,
  },
  communityGuidelines: {
    title: 'Community Guidelines',
    content: `# Community Guidelines
---

## Welcome to the Nuzzle Community

Nuzzle exists to bring dog lovers together — to share stories, ask questions, celebrate breeds, organize meetups, and build a real community around the dogs in our lives. To keep this a safe, welcoming, and genuinely useful place for everyone (humans and dogs alike), we ask all members to follow these guidelines.

Violations may result in content removal, account suspension, or a permanent ban, depending on severity. These guidelines apply to all content and behavior on Nuzzle, including posts, comments, reactions, dog profiles, meetup listings, direct interactions, and check-ins.

---

## 1. Be Kind and Respectful

Nuzzle is a community built on a shared love of dogs. Treat every member the way you'd want to be treated at a dog park.

Do:
- Engage with curiosity and openness, even when you disagree
- Offer constructive feedback and helpful corrections
- Celebrate each other's dogs and milestones

Don't:
- Insult, demean, or belittle other members or their dogs
- Attack someone personally because you disagree with their opinion
- Use sarcasm or passive-aggression to undermine others
- Pile on or gang up on a single user

Healthy debate is welcome. Personal attacks are not.

---

## 2. Keep It About Dogs

Nuzzle is a dog community, not a general social network or political forum.

Do:
- Post content relevant to dogs, breeds, dog care, meetups, or the Dog Beach
- Share related lifestyle content that naturally involves your dog(s)

Don't:
- Post off-topic political, religious, or unrelated commercial content
- Use Nuzzle as a platform to promote unrelated businesses, campaigns, or causes
- Redirect discussions away from dogs and into divisive unrelated topics

---

## 3. Be Honest and Authentic

Trust is the foundation of a useful community.

Do:
- Post genuine questions, real experiences, and accurate information
- Clearly label opinions as opinions when sharing advice
- Represent your dog's temperament and compatibility accurately — other dogs and their owners are counting on it

Don't:
- Create fake accounts or impersonate other users
- Post misleading information presented as fact
- Fabricate dog interaction logs or check-ins
- Log dog interactions on behalf of another owner without their knowledge or consent

---

## 4. Health and Veterinary Topics

Questions about dog health are some of the most important discussions on Nuzzle. Handle them responsibly.

Do:
- Share your own experiences and what worked for your dog
- Recommend consulting a licensed veterinarian for health concerns
- Acknowledge the limits of your knowledge when giving advice

Don't:
- Present yourself as a veterinary professional if you are not
- Discourage someone from seeking veterinary care
- Share unverified or dangerous health advice (e.g., harmful home remedies)
- Diagnose another user's dog

A health disclaimer is automatically shown on health-tagged posts as a reminder that content on Nuzzle is not veterinary advice.

---

## 5. Photos and Media

Photos make Nuzzle come alive. Keep them appropriate and honest.

Do:
- Share clear, well-lit photos of your dog(s)
- Include relevant context (breed, age, location, event) when it adds value

Don't:
- Post sexually explicit, graphic, or disturbing imagery
- Post photos of other people's dogs or children without permission
- Use stock photos or images you don't own as if they're your own
- Post images containing personal information (phone numbers, addresses, etc.)

---

## 6. No Hate, Discrimination, or Harassment

Nuzzle has zero tolerance for hate.

Prohibited:
- Hate speech targeting any person or group based on race, ethnicity, national origin, religion, gender, gender identity, sexual orientation, disability, or any other protected characteristic
- Harassment, threats, or intimidation of any user
- Coordinated campaigns to report, downvote, or target a specific user
- Content that sexualizes or demeans any person

This includes content in posts, comments, dog profile descriptions, meetup listings, and any other user-generated field.

---

## 7. No Spam or Self-Promotion

Keep Nuzzle's feeds useful and authentic.

Prohibited:
- Repetitive or unsolicited promotional posts for products, services, or external links
- Using Nuzzle primarily or exclusively to drive traffic to an external site, store, or social account
- Automated posting, bot accounts, or scripted activity
- Comment sections used for commercial solicitation

Sharing a product or resource you genuinely found helpful, in the relevant context, is fine. Turning Nuzzle into an ad channel is not.

---

## 8. No Animal Cruelty or Neglect

This is non-negotiable.

Prohibited:
- Any content depicting, glorifying, encouraging, or joking about cruelty, abuse, neglect, or harm toward any animal
- Content promoting or organizing animal fighting
- Sharing videos or images of animals in distress for entertainment

Violations of this rule will result in immediate and permanent account termination and may be reported to the appropriate authorities.

---

## 9. Meetups

Nuzzle meetups are a highlight of the community. Make them safe and welcoming.

Do:
- Post accurate meetup details (location, time, what to expect, dog size/energy level guidance if relevant)
- Be welcoming to all compatible dogs and their owners who RSVP
- Cancel or update your meetup promptly if plans change

Don't:
- Use meetup listings to organize non-dog-related gatherings
- Create meetups with the intent to exclude based on protected characteristics
- Harass or pressure other users to attend events

Remember: Nuzzle facilitates meetup coordination but is not responsible for events. Attend and host responsibly.

---

## 10. Dog Compatibility and Interaction Logs

Dog profiles include compatibility fields (e.g., play style, good with puppies/large/small dogs) to help owners make informed decisions about introductions.

Do:
- Fill out your dog's compatibility profile honestly
- Update it as your dog's temperament or needs change over time
- Log interactions accurately to help build a record of your dog's social history

Don't:
- Exaggerate your dog's friendliness or hide known aggression issues
- Log interactions that didn't happen or that the other dog's owner didn't consent to
- Use interaction logs to tag or follow users who have asked not to be contacted

---

## 11. Reporting and Moderation

If you see content that violates these guidelines, please report it. Every report helps keep the community safe.

How to report:
- Use the in-app report button on any post or comment
- Reports are reviewed by our moderation team

What happens after a report:
- Content may be removed if it violates these guidelines
- Repeat or serious violators may be suspended or permanently banned
- False or bad-faith reports (weaponizing the report system against users you dislike) are themselves a violation of these guidelines

We aim to be fair, consistent, and transparent in our moderation decisions.

---

## 12. Enforcement

Depending on the nature and severity of a violation, we may take the following actions:

| Severity | Example | Action |
|---|---|---|
| Minor | Off-topic post, mild spam | Content removed, warning |
| Moderate | Repeated spam, disrespectful comments | Temporary suspension |
| Serious | Harassment campaign, impersonation | Permanent ban |
| Critical | Animal cruelty, threats of violence | Immediate permanent ban; possible law enforcement referral |

We reserve the right to make enforcement decisions at our discretion. If you believe a moderation action was taken in error, you may contact us at **support@nuzzle.app** to appeal.

---

## The Spirit of These Guidelines

Rules can only go so far. The real spirit of Nuzzle is this: be the kind of community member whose dog you'd want to meet at the park. Show up with generosity, curiosity, and good faith — and bring your dog next time.

---

These guidelines are incorporated into the Nuzzle Terms of Service and should be read alongside them.

© 2026 Nuzzle. All rights reserved.`,
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    content: `# Privacy Policy
---

## 1. Introduction

Welcome to Nuzzle ("we," "our," or "us"). Nuzzle is a social community app for dog breed enthusiasts, connecting dog owners through breed-specific feeds, meetups, Dog Beach check-ins, and dog-to-dog social interactions.

This Privacy Policy explains what information we collect, how we use it, with whom we share it, and the choices you have regarding your information. By creating an account or using Nuzzle, you agree to the practices described in this policy.

---

## 2. Information We Collect

### 2.1 Account and Profile Information

When you register and use Nuzzle, we collect:

- Name and display name
- Email address
- City / location (as entered in your profile)
- Profile photo (uploaded by you)
- Authentication data — when you sign in with Apple, we receive a unique Apple ID identifier and, at your option, your name and email address from Apple

### 2.2 Dog Profile Information

For each dog you add to your account, we collect:

- Dog name, breed, and age group
- Energy level and play style
- Compatibility preferences (e.g., good with puppies, large dogs, small dogs)
- Additional notes about your dog
- Dog photo(s) (uploaded by you)

### 2.3 Content You Post

We collect content you create and share within the app, including:

- Posts (Questions, Updates/Stories, Tips, and Meetups), including any text, tags, and up to multiple photos per post
- Comments on posts
- Emoji reactions to posts
- Meetup details and RSVPs
- Dog interaction logs — records of dog-to-dog meetings you log (e.g., at Dog Beach or meetups)

### 2.4 Location Information

When you use the Dog Beach Now check-in feature, we request access to your device's location solely to verify proximity to Ocean Beach Dog Beach in San Diego. We do not continuously track your location; location access is only requested at the moment of a check-in action.

### 2.5 Usage and Activity Data

We may collect information about how you use the app, including:

- Screens and features accessed
- Breed communities you join or follow
- Posts, comments, and reactions you engage with
- Search queries and applied filters
- Notification interactions

### 2.6 Device and Technical Information

We may automatically collect:

- Device type and operating system version
- App version
- Crash logs and error reports
- Anonymous analytics identifiers

---

## 3. How We Use Your Information

We use the information we collect to:

- Provide and operate the Nuzzle app, including your personalized home feed, breed-community feeds, and notifications
- Authenticate you and maintain your session securely
- Display your profile and your dogs' profiles to other users in the community
- Enable social features — posts, comments, reactions, meetup RSVPs, and dog-to-dog interaction logs
- Power the Dog Beach Now feature by verifying your location proximity to the check-in location
- Send in-app notifications when someone comments on or reacts to your posts, RSVPs to your meetups, or logs a dog interaction involving your dog
- Support search and discovery — full-text search across posts and breed communities
- Moderate content — process reports on posts and comments and enforce our community guidelines
- Improve the app — analyze usage patterns and fix bugs
- Respond to support requests and communicate with you about your account

---

## 4. How We Share Your Information

### 4.1 With Other Nuzzle Users

Nuzzle is a social community. The following information is visible to other users by default:

- Your display name, profile photo, and city
- Your dogs' names, breeds, photos, and public compatibility profiles
- Posts, comments, and reactions you create
- Meetups you host and RSVPs you submit
- Dog interaction logs you record

### 4.2 Service Providers

We use Supabase to host our database, authentication services, and file storage (profile photos, dog photos, and post images). Supabase processes data on our behalf under their own privacy and security terms. We do not sell your personal information to third parties.

### 4.3 Apple Sign In

If you use Sign in with Apple, Apple shares limited authentication information with us as described in Apple's privacy policy. We receive only what is necessary to create and maintain your account.

### 4.4 Legal Requirements

We may disclose your information if required to do so by law, regulation, legal process, or governmental request, or to protect the rights, property, or safety of Nuzzle, our users, or others.

### 4.5 Business Transfers

If Nuzzle is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you via in-app notice or email before your information is transferred and becomes subject to a different privacy policy.

---

## 5. Photos and Media

Photos you upload (profile photos, dog photos, and post images) are stored in Supabase Storage and are accessible via public URLs to display content within the app. Do not upload photos containing sensitive personal information beyond what you intend to share with the Nuzzle community.

---

## 6. Location Data

Location access is requested on-device only when you initiate a Dog Beach Now check-in. We use your precise location at that moment solely to confirm proximity to Ocean Beach Dog Beach. We do not store your precise GPS coordinates beyond what is needed for the check-in action, and we do not share precise location data with other users.

---

## 7. Notifications

Nuzzle uses in-app notifications to alert you about community activity relevant to you (comments, reactions, meetup RSVPs, and dog interactions). We do not currently send push notifications outside the app. You can manage notification preferences within the app settings.

---

## 8. Data Retention

We retain your account information and content for as long as your account is active. If you delete your account, we will delete or anonymize your personal information within a reasonable period, except where we are required to retain it for legal or legitimate business purposes (e.g., to resolve disputes or comply with legal obligations).

Content you have posted that was reacted to or commented on by others may be anonymized rather than deleted in order to preserve the integrity of community discussions.

---

## 9. Children's Privacy

Nuzzle is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us and we will take steps to delete that information.

---

## 10. Security

We implement industry-standard security measures to protect your information, including:

- Row-level security on our database to ensure users can only access data they are permitted to see
- Encrypted connections (TLS/HTTPS) for all data in transit
- Supabase Auth with secure session management and token handling

No method of electronic transmission or storage is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.

---

## 11. Your Rights and Choices

Depending on your location, you may have the following rights regarding your personal information:

- Access — request a copy of the personal information we hold about you
- Correction — update or correct inaccurate information via your profile settings
- Deletion — request deletion of your account and associated personal data
- Portability — request a portable copy of your data
- Withdraw consent — revoke location access at any time via your device settings; this will disable Dog Beach Now check-ins

To exercise any of these rights, please contact us using the information in Section 13.

### California Residents (CCPA)

If you are a California resident, you have the right to know what personal information we collect and how it is used, the right to delete your personal information, and the right to opt out of the sale of your personal information. We do not sell personal information.

### European / UK Residents (GDPR / UK GDPR)

If you are located in the European Economic Area or the United Kingdom, our legal bases for processing your information are: performance of a contract (providing the Nuzzle service), legitimate interests (improving the app, preventing fraud), and consent (location access). You may contact us to exercise your data subject rights at any time.

---

## 12. Third-Party Links and Services

The app may link to third-party content or services. This Privacy Policy does not apply to those third parties, and we are not responsible for their privacy practices. We encourage you to review the privacy policies of any third-party services you use.

---

## 13. Contact Us

If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:

Nuzzle
Email: privacy@nuzzle.app

We will respond to your inquiry within a reasonable timeframe.

---

## 14. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do, we will update the "Last Updated" date at the top of this document and, for material changes, notify you within the app or by email. Your continued use of Nuzzle after any changes constitutes your acceptance of the updated policy.

---

© 2026 Nuzzle. All rights reserved.`,
  },
};
