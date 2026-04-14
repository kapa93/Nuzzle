/**
 * Seed script: inserts realistic comments and post_reactions for seeded posts.
 *
 * Usage:
 *   npx ts-node scripts/seedEngagement.ts
 *   npx ts-node scripts/seedEngagement.ts --env=prod
 *
 * Idempotent:
 *   - Comments:  skips rows where (post_id + author_id + content_text) already exists
 *   - Reactions: upsert with ignoreDuplicates – safe to re-run
 *
 * Reaction note: all reactions use 'LIKE' – the only reaction exposed in the UI.
 * The schema still allows the full enum; this just matches current app behaviour.
 */

import dotenv from 'dotenv';
import path from 'path';

const envArg = process.argv.find(a => a.startsWith('--env='))?.split('=')[1] ?? 'dev';
const envFile = envArg === 'prod' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
console.log(`Environment: ${envFile}`);

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(`Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${envFile}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Profile IDs ──────────────────────────────────────────────────────────────

const P = {
  // Australian Shepherd
  maya:    'f1784754-de47-416e-973b-4cc3b38ac153',
  jake:    '363de776-84af-42ff-ba57-6cbac5b9c1ed',
  sarah:   '79198548-1ef4-4433-a694-6f9ae60ffe44',
  brendan: 'c7b31f6b-6b96-4cae-a8de-6633dc9f121f',
  lena:    '2101bc11-1686-4c59-b068-8a60814631dd',
  chris:   '10e6d031-86f6-46e0-8161-6c4efc543801',
  // Dachshund
  tara:    'e904a679-c785-48b9-8f81-4606372df469',
  derek:   'bba2736b-1f5f-4e37-8ca9-2b71be7ef598',
  priyaM:  '9089ed39-9b59-42eb-b14d-8d7a97d02298',
  jen:     'cc1cf6c1-ff2c-4e13-ab1b-53e75f2626f1',
  marcus:  'e628ab57-343b-408e-a5b3-ea4df6ac7498',
  olivia:  'fe434db5-2ab5-43e4-b309-e8b43e10b7db',
  ray:     '040fe9a1-7775-4a84-9ddd-2988f1f15894',
  // German Shepherd
  nadia:   '1bbafccc-ba85-4a09-8200-d20825b0a54e',
  owen:    '83e3931a-ef76-4731-9549-929b960acb5e',
  teresa:  'a8988812-4db4-4283-9385-b9d284affbb6',
  marcusH: '2827fbe2-4772-41a5-9d67-80c11ae24e3b',
  simone:  '169d1521-a603-406d-941d-9440ed2d93aa',
  dan:     'd620bae3-e3f2-4de7-804b-9ac1a39fbcce',
  // Husky
  adrienne:'0bffa949-5c70-4bb5-83ae-adb645188fdb',
  kim:     'b6b055b9-9850-4cef-ad8e-78ccd7442b81',
  ben:     '835ebfc8-c69c-4681-ba39-05d6c430dd56',
  josh:    '32e2d069-f4a2-4117-9d05-813735304ac7',
  rachel:  '2c5bf077-cc49-4add-a920-8742e8bb0984',
  eric:    '957e4146-fd27-40ff-95c2-ae6f0e730f2b',
  // Golden Doodle
  tyler:   '1c147082-eeda-4c2d-9294-399e02fdfcf4',
  priyaS:  '1e9bcdef-d5e4-40e3-aa82-9d38c7ef89d9',
  kevin:   '0b9a2af8-19ac-4819-ba8d-2ed9bf64f2f8',
  jess:    '8f1ae823-159f-44d9-9acc-20310c49f1fa',
  diane:   '08e97e83-10b9-42e9-adf3-59f73e37826d',
  // Golden Retriever
  ana:     '2c75776b-7b41-4605-9223-6d8a317741ec',
  garrett: '66694e3f-9988-4378-9df3-671525ae0404',
  yuki:    'b68a1181-cd09-4d78-9322-11f47ba93926',
  sam:     '9f9acd96-a9ae-480b-ab1b-93cc05ebfb13',
  brooke:  '81e086b1-20aa-47ed-b286-dca03731a5df',
  mia:     'a3835e0c-1bc2-44b4-b8ea-eba23341038c',
  // Mixed Breed
  paloma:  '7ca0959f-8881-4523-a053-c67cfb68a039',
  cal:     'a99b104a-058a-4c4d-8cca-bfe7cd3ef522',
  rosie:   'b12ae1b3-95e0-472e-8454-724b01760e20',
  jordan:  '85dbbdc1-d6f2-424e-9214-624bc8c6b4e9',
  naomi:   '7a13f003-225f-47d7-a71a-6811a9ea4552',
  theo:    'f465c4d5-1fba-4183-b1f4-75540b37a66b',
  leila:   'abfe51c1-74f5-44d9-b79e-19040c569bd3',
  // Pug
  liz:     '91916b03-243c-4a47-a02c-21a081f47ca2',
  marco:   'd51e232f-794e-4ec2-a6a0-d22537fab73f',
  steph:   'ba78aed5-8e79-4d15-b004-9d6592b22112',
  david:   '1ca5417d-68de-42ae-8484-c1d4dd8c96c8',
  carla:   '9b9c57d2-f134-4dce-b01d-4fa2453cfcc7',
  pete:    '058648f9-dbb8-4158-8bcf-692704c167d8',
  // French Bulldog
  ryan:    '256dd24e-0f4d-4058-8c0c-736bbeb7aed4',
  nina:    'acf8d6dd-058d-4af2-a3e3-2cd3ac214c6f',
  claire:  'e9ef65bb-a15c-4cf4-9ca9-dfaa52f679de',
  tommy:   'bceee679-3e77-4bf6-86f0-a050d5e3755f',
  wendy:   '737ead19-798e-4d16-8701-05a499c1116b',
  greg:    '5e979f88-5414-4f91-a5ab-4482d57a902f',
  // Pit Bull
  keiko:   '4e7b6512-e890-4e92-aaf2-e03daf6d5fd1',
  jasmine: 'fba595cb-23ac-4863-9e87-d98f4669bb96',
  marcusB: '2a25bff8-1970-4821-a62b-006d005e941a',
  tanya:   '78f369f6-6ec8-404a-abb9-07d68e04a54d',
  owenR:   'cc3cd22e-5f25-47e5-a249-4aba2b0e0cff',
  sofia:   '4565f55e-9e6c-443e-9d70-aebf4be04ddb',
  darren:  'e2e20842-a250-4866-9181-f676a8ffbf42',
  // Labrador Retriever
  phil:    '50234652-5ca9-46e2-98da-2d2d2ec2348e',
  bex:     '6ff8176e-a1e8-4836-b560-ee3974b39703',
  kat:     '34a82276-1f20-400e-8a5a-b43bcab845c1',
  margot:  'e141f340-f521-4896-9f62-53b9f4a4576b',
  dana:    'e4f60a2b-b7ff-44cd-ba71-7ff8cad78b57',
  chrisN:  '639cc87e-c34a-4ddb-8ade-c22504320e3e',
  // Labradoodle
  dev:     'd51d0953-9f02-4028-b400-0b9acda89735',
  amyCh:   '93765c03-ccb5-4ea5-9032-5258c5c49c9e',
  rosieK:  '27901cf6-7b3e-4aff-8b1d-749267dc2287',
  nick:    '15fe21df-d12b-4ac4-bac3-d70a7f2d9321',
  jason:   '2f4504af-8ad4-4108-80c7-ef0fb81df27a',
  lauren:  '4c305992-e9fc-45ea-b9d8-58fc72b2a27b',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minutes after the seed batch was created (~2026-04-14T00:50:00Z). */
function ts(minutesAfterSeed: number): string {
  const base = new Date('2026-04-14T00:50:00.000Z');
  return new Date(base.getTime() + minutesAfterSeed * 60_000).toISOString();
}

// ─── Comment seed data ────────────────────────────────────────────────────────

const COMMENTS: Array<{
  post_id: string;
  author_id: string;
  content_text: string;
  created_at: string;
}> = [

  // ── AUSTRALIAN SHEPHERD ───────────────────────────────────────────────────

  // "Clover started circling my toddler" (jake – QUESTION/BEHAVIOR)
  { post_id: '8a10cfc1-cae1-45f6-9b54-a682b4066f2d', author_id: P.maya,
    created_at: ts(18), content_text:
    "Rigby did this with my sister's kid for a couple of months. Pure herding instinct – they need a job and the toddler is just the most available option. More mental enrichment helped us more than trying to train it out directly." },
  { post_id: '8a10cfc1-cae1-45f6-9b54-a682b4066f2d', author_id: P.brendan,
    created_at: ts(42), content_text:
    'Pepper went through this phase too. We added a "place" command so she had somewhere to go when kids were in the yard. Didn\'t fix the instinct but gave us a reliable redirect.' },
  { post_id: '8a10cfc1-cae1-45f6-9b54-a682b4066f2d', author_id: P.lena,
    created_at: ts(75), content_text:
    'Wren did this at a playground once, a bit mortifying. More structured trail work and it dialed back a lot over the following months. Not gone but manageable.' },

  // "Vet flagged possible hip dysplasia at age 3" (lena – QUESTION/HEALTH)
  { post_id: '19d37e34-c06f-47d1-90a4-625a778b24ef', author_id: P.maya,
    created_at: ts(20), content_text:
    'We went through something similar with Rigby. Keeping weight lean and sticking to lower-impact trail walks made a real difference. Our vet also recommended fish oil around the same time.' },
  { post_id: '19d37e34-c06f-47d1-90a4-625a778b24ef', author_id: P.brendan,
    created_at: ts(52), content_text:
    'Get a second opinion if you haven\'t yet. Pepper had some flagged concerns at 2 and a second vet read the X-rays differently. Joint supplements early seemed to help her.' },
  { post_id: '19d37e34-c06f-47d1-90a4-625a778b24ef', author_id: P.chris,
    created_at: ts(90), content_text:
    "A friend's aussie went through this at the same age. Hydrotherapy was a big part of their management plan. Expensive but worth asking your vet about." },

  // "How do you handle recall near other dogs?" (maya – QUESTION/TRAINING)
  { post_id: '1f80f9aa-a307-4c19-bd0e-81c45f52925d', author_id: P.jake,
    created_at: ts(22), content_text:
    'Long line work before ever going off-leash. We practiced recall in a park with dogs at distance for months before Clover was reliable near them. She still has a delay when she really wants to meet someone but she does come back.' },
  { post_id: '1f80f9aa-a307-4c19-bd0e-81c45f52925d', author_id: P.brendan,
    created_at: ts(50), content_text:
    'Only call recall when you know you can get it at first – calling and not getting it teaches them they can ignore it. We built ours up very slowly in lower-distraction environments before adding dogs.' },
  { post_id: '1f80f9aa-a307-4c19-bd0e-81c45f52925d', author_id: P.lena,
    created_at: ts(85), content_text:
    'Freeze-dried chicken reserved only for recall helped with Wren. She knows that specific call means something special is coming. Took consistent months of work.' },

  // "How much exercise is too much for a 5-month-old aussie?" (jake – QUESTION/PUPPY)
  { post_id: 'd90cb51c-695a-4cb0-8a67-3b3059542d10', author_id: P.maya,
    created_at: ts(22), content_text:
    'We followed the 5-min per month of age guideline – so about 25 minutes twice a day at that age. Free play in a yard is different from forced walking or running. Rigby is 2 with no joint issues and I was very careful early on.' },
  { post_id: 'd90cb51c-695a-4cb0-8a67-3b3059542d10', author_id: P.sarah,
    created_at: ts(55), content_text:
    'Seriously follow the 5-minute rule. A friend overdid it with an aussie and had early joint issues. More mental enrichment at that age, less running.' },

  // "Best brush for double coat shedding season?" (sarah – QUESTION/GROOMING)
  { post_id: 'e4d60c24-954c-4340-ad77-41866a260fc2', author_id: P.jake,
    created_at: ts(20), content_text:
    "Undercoat rake first, then a slicker. Do it outside because it's a lot. Don't skip weeks in spring – Clover loses what feels like half her body weight in shed." },
  { post_id: 'e4d60c24-954c-4340-ad77-41866a260fc2', author_id: P.brendan,
    created_at: ts(55), content_text:
    'We use the King Komb and it\'s been great for Pepper\'s coat – gentler than the Furminator. Line brushing in sections is worth looking up if you haven\'t tried it.' },

  // "Biscuit decided my WFH setup is his personal nap station" (sarah – UPDATE_STORY)
  { post_id: 'e2e594b6-405f-4bae-be29-f971538bd3a1', author_id: P.maya,
    created_at: ts(25), content_text:
    'Rigby claimed the other half of my standing desk mat and stares at me whenever I shift. We have matching setups now.' },
  { post_id: 'e2e594b6-405f-4bae-be29-f971538bd3a1', author_id: P.lena,
    created_at: ts(60), content_text:
    "Wren figured out that if she sleeps on my feet I don't get up as fast. They're scheming." },

  // "Aussie run at OB Dog Beach – Saturday morning" (chris – MEETUP)
  { post_id: '7e63d869-3cb0-4c5f-98e0-3cc59677ca0f', author_id: P.jake,
    created_at: ts(15), content_text:
    "We're likely in! Clover has been overdue for some Aussie time. What time usually?" },
  { post_id: '7e63d869-3cb0-4c5f-98e0-3cc59677ca0f', author_id: P.maya,
    created_at: ts(28), content_text:
    "Rigby would lose her mind. We'll try to come." },

  // ── DACHSHUND ─────────────────────────────────────────────────────────────

  // "Is my dachshund puppy normal or just feral" (tara – QUESTION/PUPPY)
  { post_id: '5e563d41-0305-4068-8109-d9c7325ac7a8', author_id: P.derek,
    created_at: ts(20), content_text:
    'Frank was the same at that age. The frantic phase settled around 10-11 months. Hang in there.' },
  { post_id: '5e563d41-0305-4068-8109-d9c7325ac7a8', author_id: P.priyaM,
    created_at: ts(46), content_text:
    'Pretzel was chaos for the first year. At some point it just calms into a different kind of chaos. Pretty standard for 6 months.' },
  { post_id: '5e563d41-0305-4068-8109-d9c7325ac7a8', author_id: P.olivia,
    created_at: ts(72), content_text:
    'Bao did the same zoomie-bite-sleep cycle for months. Totally normal from what I\'ve seen.' },

  // "Frank has claimed the couch arm as his surveillance tower" (derek – UPDATE_STORY)
  { post_id: 'd22b7add-3a68-4b1b-a725-2421d8deab25', author_id: P.tara,
    created_at: ts(15), content_text:
    'Mine has the highest spot on the back of the couch. Full surveillance mode starting at 7am.' },
  { post_id: 'd22b7add-3a68-4b1b-a725-2421d8deab25', author_id: P.jen,
    created_at: ts(35), content_text:
    'Mochi has rotating positions depending on which part of the street needs watching. Very serious work.' },

  // "Anyone have a vet rec for dachshund back issues in SD?" (priyaM – QUESTION/HEALTH)
  { post_id: 'fa86c298-8d59-4053-b884-7df187c4e7e1', author_id: P.olivia,
    created_at: ts(18), content_text:
    'Mission Valley Animal Hospital has a vet who sees a lot of dachshunds. Worth calling ahead to ask specifically.' },
  { post_id: 'fa86c298-8d59-4053-b884-7df187c4e7e1', author_id: P.derek,
    created_at: ts(42), content_text:
    'We went to VCA Mission Valley – they were familiar with the breed and not alarmist. Ask if they have experience with IVDD specifically.' },
  { post_id: 'fa86c298-8d59-4053-b884-7df187c4e7e1', author_id: P.marcus,
    created_at: ts(70), content_text:
    'Our vet near Mission Hills has worked with dachshund rescues and knows the breed well. Happy to DM the name.' },

  // "Bao gets nervous around bigger dogs" (olivia – QUESTION/BEHAVIOR)
  { post_id: '8a660086-da51-47fc-b2b7-7619d8737f4c', author_id: P.derek,
    created_at: ts(25), content_text:
    "Keep encounters very short and positive before they tip over. Frank learned that brief calm exposures were safe. Duration matters a lot at first." },
  { post_id: '8a660086-da51-47fc-b2b7-7619d8737f4c', author_id: P.tara,
    created_at: ts(55), content_text:
    'Slow exposure is the right call. Let her choose to approach, never force it. Yuki took about 4-5 months of keeping distance and rewarding calm before we saw real change.' },

  // "Small dog beach morning at OB – anyone in?" (jen – MEETUP)
  { post_id: 'bb745e8b-6512-4425-87e6-110c9d19b692', author_id: P.derek,
    created_at: ts(15), content_text:
    "Frank is in if it's not too crowded. He does better in smaller groups." },
  { post_id: 'bb745e8b-6512-4425-87e6-110c9d19b692', author_id: P.tara,
    created_at: ts(30), content_text:
    'This sounds perfect. What time are you thinking?' },

  // "Pretzel vs. the backyard sprinklers" (priyaM – UPDATE_STORY)
  { post_id: 'e9acbb2a-dbf8-4b9a-b8b1-c7dda4da6e37', author_id: P.derek,
    created_at: ts(20), content_text:
    'Frank has the same alarm bark when the garden hose comes out. Total conviction that it\'s an attack.' },
  { post_id: 'e9acbb2a-dbf8-4b9a-b8b1-c7dda4da6e37', author_id: P.jen,
    created_at: ts(40), content_text:
    'The feet got wet anyway. Perfect ending.' },

  // ── GERMAN SHEPHERD ───────────────────────────────────────────────────────

  // "Bruno barks at the door even with people he knows" (teresa – QUESTION/BEHAVIOR)
  { post_id: 'f72ce188-8e8b-4c8f-b03b-365d4f41303b', author_id: P.nadia,
    created_at: ts(25), content_text:
    'Ares does this too even with our parents. We\'ve been working on "place" when the bell rings so he has somewhere to go instead of rushing the door. Still a work in progress but better.' },
  { post_id: 'f72ce188-8e8b-4c8f-b03b-365d4f41303b', author_id: P.owen,
    created_at: ts(55), content_text:
    "We started having guests knock more softly and approach slowly. Less of a startle response meant less of a bark spike. Sounds counterintuitive but it worked for Zelda." },
  { post_id: 'f72ce188-8e8b-4c8f-b03b-365d4f41303b', author_id: P.dan,
    created_at: ts(88), content_text:
    'Ghost barks at everyone including us sometimes. It\'s an alert instinct. If he knows the person and still does it, he might just need a release behavior when people arrive.' },

  // "Ares knows every command but decides when he feels like doing them" (nadia – QUESTION/TRAINING)
  { post_id: 'e0f0f96d-d080-4a49-b0f2-1d29c4c7f555', author_id: P.owen,
    created_at: ts(20), content_text:
    'Zelda is exactly like this. GSDs have a "what\'s in it for me" mode. High-value treats only in challenging situations and never ask for something you can\'t enforce.' },
  { post_id: 'e0f0f96d-d080-4a49-b0f2-1d29c4c7f555', author_id: P.marcusH,
    created_at: ts(50), content_text:
    "Nora had the same selective engagement. Shorter, snappier sessions worked much better than long drilling. If you feel them checking out, stop before they disengage on their own." },
  { post_id: 'e0f0f96d-d080-4a49-b0f2-1d29c4c7f555', author_id: P.teresa,
    created_at: ts(82), content_text:
    'Bruno does this with "down" specifically. We went back to basics and rebuilt from the ground. Sometimes the foundation drifts and they test you.' },

  // "on-leash intros with Nora are always a whole production" (marcusH – QUESTION/BEHAVIOR)
  { post_id: '84bcce5c-dc91-4673-8628-601ef55f7a19', author_id: P.nadia,
    created_at: ts(25), content_text:
    'Ares is the same. We stopped doing face-to-face on-leash intros entirely. Parallel walking at distance first, let them sniff at an angle if at all. Makes a huge difference.' },
  { post_id: '84bcce5c-dc91-4673-8628-601ef55f7a19', author_id: P.dan,
    created_at: ts(55), content_text:
    'Parallel walk, not head-on – changed everything for Ghost. Head-on approaches are inherently confrontational. Side-by-side with distance, then gradually drift closer.' },
  { post_id: '84bcce5c-dc91-4673-8628-601ef55f7a19', author_id: P.teresa,
    created_at: ts(88), content_text:
    'Bruno can look like he\'s escalating when he\'s actually just over-aroused. They can look similar. A trainer helped us read him better and respond differently.' },

  // "GSD meetup at Fiesta Island – Sunday morning" (marcusH – MEETUP)
  { post_id: '8c9a7c16-d51d-4d3d-8ff8-46e32d7b2d3e', author_id: P.nadia,
    created_at: ts(15), content_text:
    "We'd love this. Ares needs a real run." },
  { post_id: '8c9a7c16-d51d-4d3d-8ff8-46e32d7b2d3e', author_id: P.dan,
    created_at: ts(30), content_text:
    "Ghost does okay with well-socialized dogs. We'll try to make it." },

  // "Ghost at Dog Beach – nervous big dog does okay" (dan – UPDATE_STORY)
  { post_id: '947d65a7-7a92-4412-a852-3d50b99570a2', author_id: P.nadia,
    created_at: ts(20), content_text:
    'This is such a win. Ares took a long time before he was comfortable at a beach with that many dogs. It really does get better.' },
  { post_id: '947d65a7-7a92-4412-a852-3d50b99570a2', author_id: P.teresa,
    created_at: ts(45), content_text:
    'The perimeter patrol phase is so real for this breed. Bruno still does it at new places.' },

  // ── HUSKY ─────────────────────────────────────────────────────────────────

  // "Has anyone actually gotten reliable recall on a husky?" (kim – QUESTION/TRAINING)
  { post_id: 'c520567a-924c-4cfe-ad7a-482dbae64174', author_id: P.adrienne,
    created_at: ts(20), content_text:
    "After two huskies I've made peace with off-leash only in fully enclosed areas. Mako has excellent recall in our yard and basically none on a trail. The breed has a hard-wired go-explore mode that overrides training for a lot of dogs." },
  { post_id: 'c520567a-924c-4cfe-ad7a-482dbae64174', author_id: P.ben,
    created_at: ts(50), content_text:
    "Sasha has decent recall in controlled settings and almost none outside. A trainer told us to stop chasing and make coming back more exciting than whatever she was running toward. It helped but she still has a delay." },
  { post_id: 'c520567a-924c-4cfe-ad7a-482dbae64174', author_id: P.josh,
    created_at: ts(85), content_text:
    'Trainer told us the most honest thing: some huskies just don\'t have reliable off-leash recall and that\'s okay. Reframed things for us. We do long-line work and call it a day.' },
  { post_id: 'c520567a-924c-4cfe-ad7a-482dbae64174', author_id: P.rachel,
    created_at: ts(112), content_text:
    'Nova literally looks at me, then at the field, then makes a decision. Outside she\'s always on a 30-foot line.' },

  // "Nova howls every time we leave – neighbor left a note" (rachel – QUESTION/BEHAVIOR)
  { post_id: 'b40e8185-24de-4bf3-bba2-fbebe40bb2ca', author_id: P.adrienne,
    created_at: ts(25), content_text:
    'Mako did this for the first 8 months. We worked through it with very short departures and came back before he escalated. A white noise machine outside the door also helped.' },
  { post_id: 'b40e8185-24de-4bf3-bba2-fbebe40bb2ca', author_id: P.kim,
    created_at: ts(55), content_text:
    "The neighbor note is rough. We sent ours a text to warn them when we'd be out. Not a real fix but it helped our relationship while we worked on the actual problem." },
  { post_id: 'b40e8185-24de-4bf3-bba2-fbebe40bb2ca', author_id: P.ben,
    created_at: ts(88), content_text:
    'Frozen stuffed Kongs left at the door at departure gave Sasha something to do in those first few minutes. The howling came later and we were usually back by then.' },

  // "Managing a husky in San Diego heat" (adrienne – QUESTION/HEALTH)
  { post_id: '61ae1e06-33e7-4cba-9f6d-f5b06ce1acbc', author_id: P.ben,
    created_at: ts(20), content_text:
    "5am walks before sunrise, frozen treats midday, kiddie pool in the shade. Sasha manages but you have to be the one managing it because she'll never ask to slow down when she should." },
  { post_id: '61ae1e06-33e7-4cba-9f6d-f5b06ce1acbc', author_id: P.josh,
    created_at: ts(50), content_text:
    'We moved all exercise to early morning and evening only. Always carry water. Huskies will push past their limit before they stop on their own.' },
  { post_id: '61ae1e06-33e7-4cba-9f6d-f5b06ce1acbc', author_id: P.rachel,
    created_at: ts(88), content_text:
    'Cooling mat for the afternoons, and keep the coat full – shaving is tempting but it doesn\'t actually help them cool and can cause sunburn.' },

  // "Sasha talks back – is this just a husky thing?" (ben – QUESTION/BEHAVIOR)
  { post_id: '630560e4-30f7-434a-b2f9-a9ce288b67ba', author_id: P.kim,
    created_at: ts(20), content_text:
    "Yes this is just husky. Mochi has full conversations about things she disagrees with. The solution is to not engage with the argument." },
  { post_id: '630560e4-30f7-434a-b2f9-a9ce288b67ba', author_id: P.adrienne,
    created_at: ts(50), content_text:
    'Mako does this when I ask him to do something he doesn\'t want to do. Full protest vocalization. We just say "yes I know, do it anyway" and eventually he does.' },

  // "Sasha found the gap in my fence I didn't know existed" (ben – UPDATE_STORY)
  { post_id: 'ed058173-024f-417e-a33f-f2f85fde74ce', author_id: P.adrienne,
    created_at: ts(20), content_text:
    "Mako found a gap I didn't know about in my first month. Did a full perimeter check after that. They're engineers." },
  { post_id: 'ed058173-024f-417e-a33f-f2f85fde74ce', author_id: P.rachel,
    created_at: ts(48), content_text:
    'Huskies will find every structural weakness. I treated my yard like a security audit when I got Nova and still found two gaps I\'d missed.' },

  // "Husky play morning at Grape Street – Saturday 8:30" (kim – MEETUP)
  { post_id: '21bfecb1-dc58-41d9-a8ee-ed1dce43bf41', author_id: P.ben,
    created_at: ts(15), content_text:
    "We'll try to make this. Sasha does well at Grape Street." },
  { post_id: '21bfecb1-dc58-41d9-a8ee-ed1dce43bf41', author_id: P.adrienne,
    created_at: ts(30), content_text:
    "Mako is in. He's been cooped up this week." },

  // ── GOLDEN DOODLE ─────────────────────────────────────────────────────────

  // "How often is everyone actually taking their doodle to the groomer?" (camille – QUESTION/GROOMING)
  { post_id: '12df68d0-e90b-4cd4-8743-c80a46a4c76f', author_id: P.tyler,
    created_at: ts(20), content_text:
    'Every 6-8 weeks minimum. I went 12 once and it was a disaster. Our groomer said 8 is the max window if you\'re brushing at home 2-3 times a week.' },
  { post_id: '12df68d0-e90b-4cd4-8743-c80a46a4c76f', author_id: P.jess,
    created_at: ts(50), content_text:
    'Otto gets bad matting behind the ears if we push past 8 weeks. 6 is our sweet spot when we\'re brushing consistently at home.' },
  { post_id: '12df68d0-e90b-4cd4-8743-c80a46a4c76f', author_id: P.kevin,
    created_at: ts(80), content_text:
    "Depends on coat type too. Ziggy's fleece coat mats faster than a wavy coat. 6 weeks for us." },

  // "Clementine jumps on everyone and I cannot get it to stop" (priyaS – QUESTION/BEHAVIOR)
  { post_id: '7a0ce65e-6aad-47a6-8808-09021e660a39', author_id: P.tyler,
    created_at: ts(25), content_text:
    "We made the rule that no one greets our dog until all four paws are on the ground – including us. Inconsistency from guests is the biggest problem. Brief everyone when they come in." },
  { post_id: '7a0ce65e-6aad-47a6-8808-09021e660a39', author_id: P.jess,
    created_at: ts(55), content_text:
    "Four on the floor helped Otto eventually but it takes months of everyone enforcing it. The breed is so social they just need a consistent alternative behavior, not just a correction." },
  { post_id: '7a0ce65e-6aad-47a6-8808-09021e660a39', author_id: P.kevin,
    created_at: ts(88), content_text:
    "Ziggy still does it with new people after two years. We've mostly accepted that enthusiastic is part of the package." },

  // "At what age did your doodle actually calm down?" (priyaS – QUESTION/BEHAVIOR)
  { post_id: '881051cc-c176-4c38-b524-815909f661f5', author_id: P.tyler,
    created_at: ts(20), content_text:
    'Remi was around 2.5. Something shifted and he became more settled. Still energetic but not frantic.' },
  { post_id: '881051cc-c176-4c38-b524-815909f661f5', author_id: P.jess,
    created_at: ts(45), content_text:
    "Otto is 3 and I'd say 70% calm. The other 30% comes out when new people arrive." },
  { post_id: '881051cc-c176-4c38-b524-815909f661f5', author_id: P.kevin,
    created_at: ts(72), content_text:
    'Our vet said 3 for doodles because of the poodle side. She was right – there\'s a real shift around 2.5-3.' },

  // "Got a goldendoodle because my wife is allergic" (tyler – UPDATE_STORY)
  { post_id: 'b2af5d7b-9d6c-4de6-b3c8-2c893bbff9a8', author_id: P.jess,
    created_at: ts(20), content_text:
    "We had the exact same situation. The 'hypoallergenic' marketing is... optimistic. Our doodle definitely triggers allergies. Hope she's finding workarounds." },
  { post_id: 'b2af5d7b-9d6c-4de6-b3c8-2c893bbff9a8', author_id: P.priyaS,
    created_at: ts(50), content_text:
    'Clementine sheds more than I was told to expect. Coats vary a lot even within the same litter.' },

  // "First dog ever – how do I know if I should hire a trainer?" (diane – QUESTION/TRAINING)
  { post_id: 'aa929f7c-b376-4e7f-ad9f-2e02d1f5294b', author_id: P.tyler,
    created_at: ts(20), content_text:
    'For a first dog, yes. Even 4-6 group classes gives you a framework that pays off for years.' },
  { post_id: 'aa929f7c-b376-4e7f-ad9f-2e02d1f5294b', author_id: P.priyaS,
    created_at: ts(50), content_text:
    "I waited too long with Clementine. The habits she built in the first 6 months were hard to undo. Even a single consult is worth it to start right." },

  // "Doodle playdate at Morley Field – Sunday morning" (jess – MEETUP)
  { post_id: '21edd00d-e8a6-4766-a49d-76f5fdb6af50', author_id: P.priyaS,
    created_at: ts(15), content_text:
    "Clementine would love Morley Field. We're in if the timing works." },
  { post_id: '21edd00d-e8a6-4766-a49d-76f5fdb6af50', author_id: P.diane,
    created_at: ts(30), content_text:
    "Hazel needs this. Count us in." },

  // ── GOLDEN RETRIEVER ──────────────────────────────────────────────────────

  // "Golden owners – are you doing any proactive cancer screening?" (ana – QUESTION/HEALTH)
  { post_id: 'e4c656d3-3b2a-4e36-bded-29db34111577', author_id: P.sam,
    created_at: ts(25), content_text:
    "We do annual comprehensive bloodwork and a chest X-ray now. Chester's oncologist mentioned the Golden Retriever Lifetime Study – not a screening tool but it gave us context for what to watch." },
  { post_id: 'e4c656d3-3b2a-4e36-bded-29db34111577', author_id: P.garrett,
    created_at: ts(55), content_text:
    "We started full panels at 4 because of the breed stats. Vet said baseline data matters more for goldens than most breeds. Hard to have that conversation when they're young but it's worth it." },
  { post_id: 'e4c656d3-3b2a-4e36-bded-29db34111577', author_id: P.brooke,
    created_at: ts(88), content_text:
    'The early bloodwork builds a baseline so changes later are more visible. We do the full panel at 5 and up. Such an important topic for this breed.' },

  // "Managing hip stiffness in an older golden" (sam – QUESTION/HEALTH)
  { post_id: '36a5db88-a8a6-477d-9841-c4578ee64ef8', author_id: P.ana,
    created_at: ts(20), content_text:
    "We started fish oil and a joint supplement at 6 as a preventative. Our vet recommended it specifically for the breed. The difference in Biscoff's movement has been noticeable." },
  { post_id: '36a5db88-a8a6-477d-9841-c4578ee64ef8', author_id: P.yuki,
    created_at: ts(55), content_text:
    "Oatmeal isn't there yet but we're already doing the prep – shorter walks, more swim time, watching the stairs. Vet said goldens often mask discomfort until it's significant." },
  { post_id: '36a5db88-a8a6-477d-9841-c4578ee64ef8', author_id: P.brooke,
    created_at: ts(88), content_text:
    "The orthopedic bed made a huge difference for Penny. Also keeping them warm before the first walk of the day – they're stiffest right after sleep." },

  // "Chester is 8 now and everything is a little slower" (sam – UPDATE_STORY)
  { post_id: '51f15c9d-45f4-4aee-a143-6467b26e3313', author_id: P.ana,
    created_at: ts(25), content_text:
    "Biscoff isn't 8 yet but this made me a little emotional. Enjoy every slower walk. They're still so happy." },
  { post_id: '51f15c9d-45f4-4aee-a143-6467b26e3313', author_id: P.garrett,
    created_at: ts(55), content_text:
    "The joy doesn't go anywhere even when the pace does. Chester sounds like a really good boy." },

  // "Biscoff found the garden and carried a zucchini for 20 minutes" (ana – UPDATE_STORY)
  { post_id: 'f15b8e18-955e-4ae0-8e53-7e958c0aeed8', author_id: P.garrett,
    created_at: ts(20), content_text:
    "Humphrey got into the compost once. Just carried a banana peel around like he'd found treasure." },
  { post_id: 'f15b8e18-955e-4ae0-8e53-7e958c0aeed8', author_id: P.yuki,
    created_at: ts(45), content_text:
    'Oatmeal presents garden items to us like she grew them herself. Very proud.' },

  // "Golden meetup at Dog Beach – Saturday morning" (brooke – MEETUP)
  { post_id: '7a997bc4-db75-4a9a-8e40-ed8def911e49', author_id: P.ana,
    created_at: ts(15), content_text:
    "Biscoff would love this. We're in." },
  { post_id: '7a997bc4-db75-4a9a-8e40-ed8def911e49', author_id: P.yuki,
    created_at: ts(28), content_text:
    "Oatmeal is definitely in. She needs beach time." },

  // ── MIXED BREED ───────────────────────────────────────────────────────────

  // "Beets was a stray for two years before the rescue found her" (naomi – UPDATE_STORY)
  { post_id: '9f600fa9-7b6c-48f2-964b-f05f14097629', author_id: P.leila,
    created_at: ts(25), content_text:
    "Cricket came from a tough start too. The timeline really does vary – some weeks feel like huge progress and then something small spooks her again." },
  { post_id: '9f600fa9-7b6c-48f2-964b-f05f14097629', author_id: P.paloma,
    created_at: ts(55), content_text:
    "Fennel was feral for months in my house. Two years in she's still working on some things. Thank you for sharing this." },
  { post_id: '9f600fa9-7b6c-48f2-964b-f05f14097629', author_id: P.rosie,
    created_at: ts(88), content_text:
    "You're rebuilding trust that was broken before you even met them. Sounds like she's in exactly the right place." },

  // "Three months in and Beets still seems on edge" (naomi – QUESTION/BEHAVIOR)
  { post_id: '7ebb1355-2bad-4375-9f70-efdd494a3877', author_id: P.paloma,
    created_at: ts(20), content_text:
    "With Fennel it was closer to 5 months before I saw real relaxation. The 'flinch less' moment was a big milestone. Three months is still early." },
  { post_id: '7ebb1355-2bad-4375-9f70-efdd494a3877', author_id: P.rosie,
    created_at: ts(50), content_text:
    "Some weeks feel like regression but they rarely are. Write down small wins – first time she ate with people in the room, first voluntary cuddle. The timeline for strays is very individual." },
  { post_id: '7ebb1355-2bad-4375-9f70-efdd494a3877', author_id: P.leila,
    created_at: ts(82), content_text:
    "Cricket was on edge much longer than 3 months. Keep the environment predictable and don't rush it." },

  // "One year with Fennel" (paloma – UPDATE_STORY)
  { post_id: 'd54ef66c-de23-4348-be47-1d582f41a3e8', author_id: P.naomi,
    created_at: ts(20), content_text:
    "This is so sweet. Beets is almost at one year and it really does feel different. You start to trust each other." },
  { post_id: 'd54ef66c-de23-4348-be47-1d582f41a3e8', author_id: P.theo,
    created_at: ts(45), content_text:
    "The first year is a lot of work and then you look up and you have a real partnership. Congrats." },

  // "Did your dog's DNA results change how you interact with them?" (paloma – QUESTION/BEHAVIOR)
  { post_id: '7cd6a8e2-78fd-4827-ba90-19e8562d7d1b', author_id: P.cal,
    created_at: ts(20), content_text:
    "Desi had GSD and terrier in her results and it explained the alert intensity. I stopped trying to override her instinct and started working with it instead." },
  { post_id: '7cd6a8e2-78fd-4827-ba90-19e8562d7d1b', author_id: P.naomi,
    created_at: ts(50), content_text:
    "Beets had results we didn't expect and yes, it reframed some behaviors that were frustrating. Knowing the 'why' helped." },

  // "Mixed breed meetup at Balboa Park – Saturday morning" (rosie – MEETUP)
  { post_id: 'b46f1284-a28b-4c80-8ff4-9d59ff6ddb3a', author_id: P.paloma,
    created_at: ts(15), content_text:
    "Fennel would love this! Mixed breed crew is always the best energy." },

  // ── PUG ───────────────────────────────────────────────────────────────────

  // "Noodles does this alarming gasping thing – is this reverse sneezing?" (david – QUESTION/PUPPY)
  { post_id: '757e8d90-9bc8-40fb-b33e-317805d24c58', author_id: P.liz,
    created_at: ts(20), content_text:
    "Benny did this constantly as a puppy. It's almost always reverse sneezing in pugs. Covering one nostril gently for a second can break the episode – ask your vet to demo it." },
  { post_id: '757e8d90-9bc8-40fb-b33e-317805d24c58', author_id: P.pete,
    created_at: ts(50), content_text:
    "It sounds terrifying the first time. The technique is: cover one nostril gently and stroke the throat. Usually stops within 30 seconds." },
  { post_id: '757e8d90-9bc8-40fb-b33e-317805d24c58', author_id: P.carla,
    created_at: ts(82), content_text:
    "Figgy does this after drinking water too fast. Totally normal for the breed, just unsettling to watch every time." },

  // "When did you decide to do the BOAS surgery?" (liz – QUESTION/HEALTH)
  { post_id: 'ed313d7c-c5ea-4997-a33d-ea4b7344a522', author_id: P.pete,
    created_at: ts(25), content_text:
    "We did it with Benny at 2 after he started really struggling in heat. Surgery was smoother than we expected and the difference was significant. He can exercise more and the snoring is way better." },
  { post_id: 'ed313d7c-c5ea-4997-a33d-ea4b7344a522', author_id: P.steph,
    created_at: ts(55), content_text:
    "Barnaby had a consult and the vet said moderate. We're monitoring for now, but I know several pug owners who did it and don't regret it at all." },
  { post_id: 'ed313d7c-c5ea-4997-a33d-ea4b7344a522', author_id: P.david,
    created_at: ts(88), content_text:
    "Noodles had it done at 18 months. Recovery was about 2 weeks and she's been better since. Would do it again." },

  // "I recorded Benny sleeping and regret nothing" (liz – UPDATE_STORY)
  { post_id: 'e068d958-3095-4b50-97ee-7a78663c263d', author_id: P.pete,
    created_at: ts(20), content_text:
    "The snoring in that video is going to live rent-free in my head now." },
  { post_id: 'e068d958-3095-4b50-97ee-7a78663c263d', author_id: P.marco,
    created_at: ts(40), content_text:
    "This is exactly the pug content I come here for." },

  // "Figgy invented a sock game and I'm just a participant now" (carla – UPDATE_STORY)
  { post_id: '0259037d-8d4e-4e57-a27e-fdf960470bc8', author_id: P.liz,
    created_at: ts(15), content_text:
    "This is exactly the pug experience. You think you're training them and then one day you realize they've been training you." },
  { post_id: '0259037d-8d4e-4e57-a27e-fdf960470bc8', author_id: P.marco,
    created_at: ts(40), content_text:
    "Tulip invented a game where she brings me a toy and I'm only allowed to hold it for exactly 3 seconds. I've been playing it correctly for two years." },

  // "Figgy can barely handle 15 minutes in June" (carla – QUESTION/HEALTH)
  { post_id: '2f4afa4d-4baf-4441-a33b-d066d713d344', author_id: P.liz,
    created_at: ts(20), content_text:
    "We don't walk Benny between 9am and 7pm in summer. Mornings before 7:30 and evenings after 7:30. Kiddie pool in the shade for midday. It's a whole season management thing." },
  { post_id: '2f4afa4d-4baf-4441-a33b-d066d713d344', author_id: P.steph,
    created_at: ts(50), content_text:
    "Barnaby actually refuses to go further when it's too hot, which is pretty smart for a pug. We just let him lead the walk length in summer." },

  // "Pug meetup at Morley Field – shaded end, Sunday morning" (carla – MEETUP)
  { post_id: '9595a1cd-49ca-4217-8d01-f2023e9f12cd', author_id: P.liz,
    created_at: ts(15), content_text:
    "Benny and I are in. He loves seeing the flat faces." },
  { post_id: '9595a1cd-49ca-4217-8d01-f2023e9f12cd', author_id: P.pete,
    created_at: ts(30), content_text:
    "This is the event Benny has been waiting for." },

  // "Can anyone help me identify this eye thing on Barnaby?" (steph – QUESTION/HEALTH)
  { post_id: '32ae8e23-cd3c-4cf6-a642-ce3bb6dda1c5', author_id: P.marco,
    created_at: ts(20), content_text:
    "Tulip had something similar once. Vet said superficial corneal inflammation – gave us drops and it cleared up. Definitely worth getting looked at sooner than later." },
  { post_id: '32ae8e23-cd3c-4cf6-a642-ce3bb6dda1c5', author_id: P.david,
    created_at: ts(45), content_text:
    "A vet really needs to see this. Pug eyes can get complicated fast. Right call posting it." },

  // ── FRENCH BULLDOG ────────────────────────────────────────────────────────

  // "how do you actually get a frenchie to do what you want" (greg – QUESTION/TRAINING)
  { post_id: 'f542dc87-5140-489e-a5ae-a689df9f0d5d', author_id: P.ryan,
    created_at: ts(20), content_text:
    "Potato responds to food, tone of voice, and bribes. In that order. Nothing works once he's decided not to engage." },
  { post_id: 'f542dc87-5140-489e-a5ae-a689df9f0d5d', author_id: P.nina,
    created_at: ts(45), content_text:
    "Short sessions with high-value rewards. Archie checks out in about 5 minutes and you can see it happen. Stop before they disengage on their own." },
  { post_id: 'f542dc87-5140-489e-a5ae-a689df9f0d5d', author_id: P.claire,
    created_at: ts(78), content_text:
    "Consistency and very short bursts. Gus loses interest fast and you can see it on his face." },

  // "Archie versus the 10-minute morning walk" (nina – UPDATE_STORY)
  { post_id: 'd8f55f1f-3c66-4622-a6b9-c2caba53cc2b', author_id: P.ryan,
    created_at: ts(15), content_text:
    "Potato stops every 20 feet to assess the situation. There's no rushing it." },
  { post_id: 'd8f55f1f-3c66-4622-a6b9-c2caba53cc2b', author_id: P.tommy,
    created_at: ts(35), content_text:
    "They're making an executive decision about whether the walk is worth their current energy level. Very deliberate." },

  // "Gus decided his dog bed was for other dogs" (claire – UPDATE_STORY)
  { post_id: '8c5d2392-e573-4701-aca8-56fd3b874450', author_id: P.nina,
    created_at: ts(15), content_text:
    "Archie claimed our couch the first night and has never looked back. The dog bed is purely decorative." },
  { post_id: '8c5d2392-e573-4701-aca8-56fd3b874450', author_id: P.ryan,
    created_at: ts(35), content_text:
    "Potato's dog bed exists as a monument to our naivety. It's never been slept in." },

  // "Managing frenchie skin allergies without a full elimination diet" (claire – QUESTION/HEALTH)
  { post_id: 'eeb9e7ea-0bc7-472f-91ac-a365f5f8e516', author_id: P.nina,
    created_at: ts(20), content_text:
    "We went through this with Archie. Changing protein source helped before going full elimination diet. Chicken is a common culprit for frenchies." },
  { post_id: 'eeb9e7ea-0bc7-472f-91ac-a365f5f8e516', author_id: P.ryan,
    created_at: ts(50), content_text:
    "Potato had skin issues and we just switched to a limited ingredient food first. Not guaranteed but a reasonable first step before the full elimination process." },

  // "Frenchie beach morning at Coronado – Sunday 7:30am" (tommy – MEETUP)
  { post_id: 'fabea6d1-a142-4deb-b234-a0b56eba7516', author_id: P.ryan,
    created_at: ts(15), content_text:
    "Potato and I are in. Early morning before it heats up is perfect for this breed." },
  { post_id: 'fabea6d1-a142-4deb-b234-a0b56eba7516', author_id: P.wendy,
    created_at: ts(30), content_text:
    "Pascal loves Coronado. Count us in." },

  // "Pascal found a bug and I thought something was wrong with him" (wendy – UPDATE_STORY)
  { post_id: '96ea0f68-0a39-4bde-bd3e-19fd3c6add6f', author_id: P.ryan,
    created_at: ts(20), content_text:
    "Potato found a pill bug and absolutely lost his mind. Frenchies and insects are a whole genre." },
  { post_id: '96ea0f68-0a39-4bde-bd3e-19fd3c6add6f', author_id: P.nina,
    created_at: ts(45), content_text:
    "Archie did this with a spider. I've never seen him move that fast. Pure theatrical horror." },

  // ── PIT BULL ──────────────────────────────────────────────────────────────

  // "People cross the street when they see Hank and I'm not sure how to feel about it" (keiko – QUESTION/BEHAVIOR)
  { post_id: 'd51637c9-396c-4628-9aa9-25af860be3ad', author_id: P.jasmine,
    created_at: ts(20), content_text:
    "Duke's CGC certificate and his behavior in public have shifted some people's reaction. I've accepted that some won't see past the breed and put my energy toward the ones who will." },
  { post_id: 'd51637c9-396c-4628-9aa9-25af860be3ad', author_id: P.marcusB,
    created_at: ts(50), content_text:
    "Ruthie gets the same. It used to sting. Now I use it as a chance to let her show who she actually is. Not everyone is interested but the ones who stop and meet her often leave with a different view." },
  { post_id: 'd51637c9-396c-4628-9aa9-25af860be3ad', author_id: P.tanya,
    created_at: ts(82), content_text:
    "Peanut is 3 now and a good ambassador. You know the dog you have." },
  { post_id: 'd51637c9-396c-4628-9aa9-25af860be3ad', author_id: P.owenR,
    created_at: ts(112), content_text:
    "Clyde gets it too and he's one of the most gentle dogs I've been around. Let the dog do the talking." },

  // "Duke passed his Canine Good Citizen test today" (jasmine – UPDATE_STORY)
  { post_id: 'afc2eb2e-b6f7-4622-85e9-d228abbeb8c6', author_id: P.keiko,
    created_at: ts(20), content_text:
    "This is huge. Hank has a good temperament but we haven't done the CGC yet. You've inspired me to actually sign up." },
  { post_id: 'afc2eb2e-b6f7-4622-85e9-d228abbeb8c6', author_id: P.marcusB,
    created_at: ts(50), content_text:
    "Ruthie passed hers earlier this year. The test is not hard – they already know this stuff. It's just proving it formally." },
  { post_id: 'afc2eb2e-b6f7-4622-85e9-d228abbeb8c6', author_id: P.owenR,
    created_at: ts(82), content_text:
    "Clyde would nail the controlled greeting part. This is real motivation to get it done." },

  // "Ruthie has leash reactivity toward other dogs – where do I start?" (marcusB – QUESTION/BEHAVIOR)
  { post_id: '44df19b2-85bc-4e2d-b301-8090a0f7fdf0', author_id: P.jasmine,
    created_at: ts(25), content_text:
    "The BAT method helped us a lot with Duke. It's about letting the dog create distance from the trigger on their own terms. There are trainers in SD who specialize in it." },
  { post_id: '44df19b2-85bc-4e2d-b301-8090a0f7fdf0', author_id: P.owenR,
    created_at: ts(55), content_text:
    "Start really far from the trigger and reward any calm behavior. You're building a new pattern. It took us 6 months before Clyde could pass another dog on a normal sidewalk." },
  { post_id: '44df19b2-85bc-4e2d-b301-8090a0f7fdf0', author_id: P.sofia,
    created_at: ts(88), content_text:
    "Margot had this. Parallel walking at distance with a reactive dog trainer made the most difference. The key is staying under threshold the whole time." },

  // "How do you find pit-friendly rental housing in San Diego?" (darren – QUESTION/ADULT)
  { post_id: '9f469973-b587-4392-9cc8-afe56ef30b31', author_id: P.jasmine,
    created_at: ts(20), content_text:
    "We put together a pet resume – vet references, CGC certificate, a photo of Duke being calm near kids. It worked for our current landlord." },
  { post_id: '9f469973-b587-4392-9cc8-afe56ef30b31', author_id: P.owenR,
    created_at: ts(50), content_text:
    "Training certificates and vet history helped in our inquiry. Some places still said no. The ones who said yes after seeing it were better landlords anyway." },
  { post_id: '9f469973-b587-4392-9cc8-afe56ef30b31', author_id: P.sofia,
    created_at: ts(82), content_text:
    "SD has a lot of breed-restricted buildings. Independent landlords are much more flexible than large property management companies. Worth targeting your search that way." },

  // "Structured pit meet at Grape Street – Sunday 8am" (owenR – MEETUP)
  { post_id: '12896c08-ab45-4d77-bd5f-6d9d929647d2', author_id: P.jasmine,
    created_at: ts(15), content_text:
    "We'd love to come. Duke does really well in structured settings." },
  { post_id: '12896c08-ab45-4d77-bd5f-6d9d929647d2', author_id: P.tanya,
    created_at: ts(30), content_text:
    "Peanut and I are interested. The structured format sounds right for him." },

  // ── LABRADOR RETRIEVER ────────────────────────────────────────────────────

  // "Does your lab seem genuinely starving or is it all performance?" (dana – QUESTION/BEHAVIOR)
  { post_id: '2c792eb2-2f9c-449e-a046-7f434f7531e1', author_id: P.phil,
    created_at: ts(20), content_text:
    "Dot acts starving on a fixed measured amount every day. We've had the vet confirm healthy weight twice now. The performance is truly committed." },
  { post_id: '2c792eb2-2f9c-449e-a046-7f434f7531e1', author_id: P.margot,
    created_at: ts(50), content_text:
    "Fletcher has this energy. The vet says healthy and well-fed. Fletcher does not agree and will not accept this." },
  { post_id: '2c792eb2-2f9c-449e-a046-7f434f7531e1', author_id: P.chrisN,
    created_at: ts(82), content_text:
    "Olive has figured out that staring at my dinner plate with enough intensity sometimes results in food. She is not wrong." },

  // "Olive ate part of my couch while I was gone for two hours" (chrisN – QUESTION/BEHAVIOR)
  { post_id: '62c1c738-8cfc-4ab2-a661-3b9b1433fc4c', author_id: P.phil,
    created_at: ts(25), content_text:
    "Dot's vet said Labs have an oral fixation tied to their retrieving history. The solution is removing everything chewable and providing unlimited appropriate alternatives. It does improve with age." },
  { post_id: '62c1c738-8cfc-4ab2-a661-3b9b1433fc4c', author_id: P.dana,
    created_at: ts(55), content_text:
    "Bosley destroyed a chair cushion. Now he gets a rotation of frozen stuffed Kongs at departure. He'd rather have those." },
  { post_id: '62c1c738-8cfc-4ab2-a661-3b9b1433fc4c', author_id: P.margot,
    created_at: ts(88), content_text:
    "Fletcher did this at 10 months. Crating when unsupervised until they're past the worst of it was our answer." },

  // "Dot carries my shoe to the door every time I come home" (phil – UPDATE_STORY)
  { post_id: '04fca04d-96fa-4124-aa86-d38b8af5999d', author_id: P.margot,
    created_at: ts(20), content_text:
    "Fletcher brings his ball every single time I walk in. The joy is genuinely moving every time." },
  { post_id: '04fca04d-96fa-4124-aa86-d38b8af5999d', author_id: P.dana,
    created_at: ts(45), content_text:
    "Bosley brings me a sock. Not my sock. Just finds one somewhere and presents it. It's the thought." },

  // "Lab fetch meetup at Mission Bay – Sunday morning" (bex – MEETUP)
  { post_id: 'd87163cc-0e69-4a8d-bfc0-e0bb3e90d8de', author_id: P.margot,
    created_at: ts(15), content_text:
    "Fletcher would be in his element at Mission Bay. We'll try to come." },
  { post_id: 'd87163cc-0e69-4a8d-bfc0-e0bb3e90d8de', author_id: P.phil,
    created_at: ts(30), content_text:
    "Dot needs this kind of outlet. We're interested." },

  // "Olive discovered the neighbor's sprinkler and it changed her" (chrisN – UPDATE_STORY)
  { post_id: '3c17d44b-762f-4673-90b0-1ebe9cdcef46', author_id: P.phil,
    created_at: ts(20), content_text:
    "Dot does the same with our garden hose. The level of commitment is very lab." },
  { post_id: '3c17d44b-762f-4673-90b0-1ebe9cdcef46', author_id: P.margot,
    created_at: ts(45), content_text:
    "Fletcher sat in a neighbor's sprinkler for 20 minutes. Total peace." },

  // ── LABRADOODLE ───────────────────────────────────────────────────────────

  // "Teddy at Dog Beach is just pure happiness" (dev – UPDATE_STORY)
  { post_id: '4d53e1a9-b55e-47ee-9a98-04411307908a', author_id: P.amyCh,
    created_at: ts(20), content_text:
    "Radar at Dog Beach is the same energy. Pure joy and zero sense of personal space." },
  { post_id: '4d53e1a9-b55e-47ee-9a98-04411307908a', author_id: P.jason,
    created_at: ts(40), content_text:
    "This is exactly what the breed is for." },

  // "Cleo is definitely not staying mini – how big did yours actually end up?" (rosieK – QUESTION/PUPPY)
  { post_id: 'c3435817-442b-4053-9b08-2680908ab2d9', author_id: P.nick,
    created_at: ts(20), content_text:
    "We were told 'compact' and ended up with 65 lbs. Compact by some other metric apparently." },
  { post_id: 'c3435817-442b-4053-9b08-2680908ab2d9', author_id: P.lauren,
    created_at: ts(50), content_text:
    "Cosmo kept growing past 14 months. The mini/standard distinction is not as precise as breeders suggest." },

  // "Cosmo was almost a service dog" (lauren – UPDATE_STORY)
  { post_id: 'e590490b-0720-4b9e-b2cd-964a0a902fba', author_id: P.dev,
    created_at: ts(20), content_text:
    "This is essentially Teddy's story too. He graduated from promising service trainee to excellent pet. Different job, still a good one." },
  { post_id: 'e590490b-0720-4b9e-b2cd-964a0a902fba', author_id: P.nick,
    created_at: ts(50), content_text:
    "The dogs who almost made it through service training seem to make the most personable pets. All the training, none of the restriction." },

  // "Does your labradoodle seem more lab or more poodle in temperament?" (amyCh – QUESTION/BEHAVIOR)
  { post_id: '2de62d17-5620-4068-952d-7ad80110a7e6', author_id: P.dev,
    created_at: ts(20), content_text:
    "Teddy is classic lab – wants to retrieve, wants everyone to be happy, zero stubbornness. Full lab personality with a curly coat." },
  { post_id: '2de62d17-5620-4068-952d-7ad80110a7e6', author_id: P.nick,
    created_at: ts(50), content_text:
    "Our labradoodle is all poodle brain. Intense focus, picks up commands fast, has opinions about everything." },

  // "Morning walk at Los Peñasquitos Canyon – labradoodle owners welcome" (nick – MEETUP)
  { post_id: '1ed331ac-2336-44ee-94c7-be4934bf1613', author_id: P.rosieK,
    created_at: ts(15), content_text:
    "We'd love to do Los Peñasquitos. When do you usually go?" },
  { post_id: '1ed331ac-2336-44ee-94c7-be4934bf1613', author_id: P.jason,
    created_at: ts(30), content_text:
    "That trail is great for labradoodles. We're potentially interested." },

  // "Labradoodle puppy meetup at Balboa Park – Saturday morning" (rosieK – MEETUP)
  { post_id: '3d1a9513-9c33-45a6-ba76-9d41da5b6154', author_id: P.dev,
    created_at: ts(15), content_text:
    "Teddy is technically past puppy stage but not past puppy energy. Can we still come?" },
  { post_id: '3d1a9513-9c33-45a6-ba76-9d41da5b6154', author_id: P.amyCh,
    created_at: ts(30), content_text:
    "Radar would love this. We're in." },
];

// ─── Reaction data: post_id → [user_ids] ─────────────────────────────────────
// All LIKE. Excludes post authors. Spread intentionally uneven for realism.

const POST_REACTIONS: Record<string, string[]> = {
  // AUSTRALIAN SHEPHERD
  'ecdffcff-c459-4323-911f-2124587fd927': [P.jake, P.brendan, P.sarah, P.lena],
  '8a10cfc1-cae1-45f6-9b54-a682b4066f2d': [P.maya, P.sarah, P.brendan, P.lena, P.chris],
  'ca2479b2-047d-444b-b26d-81bc7a856240': [P.maya, P.jake, P.lena],
  '7e63d869-3cb0-4c5f-98e0-3cc59677ca0f': [P.maya, P.jake, P.sarah, P.lena],
  'e2e594b6-405f-4bae-be29-f971538bd3a1': [P.maya, P.jake, P.brendan, P.lena, P.chris, P.sarah],
  '19d37e34-c06f-47d1-90a4-625a778b24ef': [P.maya, P.brendan, P.chris, P.sarah],
  '1f80f9aa-a307-4c19-bd0e-81c45f52925d': [P.jake, P.brendan, P.lena, P.sarah],
  'd90cb51c-695a-4cb0-8a67-3b3059542d10': [P.maya, P.sarah, P.lena, P.brendan],
  '24d89844-fe39-4405-827e-31243a974c14': [P.jake, P.brendan, P.sarah],
  'bf758e4d-b56a-44da-b5c8-24c7d7177b72': [P.maya, P.sarah, P.brendan, P.lena, P.chris],
  'e4d60c24-954c-4340-ad77-41866a260fc2': [P.jake, P.brendan, P.lena],
  '52759c57-94cc-47b3-ab74-e1fc8d88c6cc': [P.maya, P.jake, P.chris],
  '39f1a1ea-e7f8-420a-840b-357de502f688': [P.sarah, P.lena, P.jake],
  // DACHSHUND
  '5e563d41-0305-4068-8109-d9c7325ac7a8': [P.derek, P.priyaM, P.olivia, P.jen],
  'd22b7add-3a68-4b1b-a725-2421d8deab25': [P.tara, P.jen, P.priyaM, P.olivia, P.ray],
  '8cd74529-ba37-4fad-a029-f43fa18af9e6': [P.tara, P.derek, P.olivia, P.jen],
  'bb745e8b-6512-4425-87e6-110c9d19b692': [P.derek, P.tara, P.priyaM],
  'bbd3665c-4525-4242-97c1-e19ab64dec21': [P.tara, P.derek, P.olivia],
  '8a660086-da51-47fc-b2b7-7619d8737f4c': [P.derek, P.tara, P.priyaM, P.jen],
  'e9acbb2a-dbf8-4b9a-b8b1-c7dda4da6e37': [P.derek, P.jen, P.tara, P.olivia, P.ray, P.marcus],
  'f7e8013b-01ee-4898-990c-87c396ad10fd': [P.marcus, P.derek, P.olivia],
  'fa86c298-8d59-4053-b884-7df187c4e7e1': [P.olivia, P.derek, P.marcus, P.tara],
  'e9864dff-1090-4445-b07f-e65b76ea1ef3': [P.tara, P.derek, P.priyaM],
  '4af2fed9-dafa-4eb0-bc41-d987bc57527b': [P.tara, P.derek, P.priyaM, P.marcus],
  'ce8f0210-99c2-473c-b6e0-3367bf071f9c': [P.derek, P.tara, P.olivia, P.jen, P.marcus],
  '0b8d252f-032b-4198-8473-1978dc474031': [P.derek, P.marcus, P.tara],
  // GERMAN SHEPHERD
  '5e2a82f8-a8f0-42a8-94f9-6ba03c723228': [P.owen, P.teresa, P.marcusH, P.simone, P.dan],
  '978acf5a-ff8d-4a90-82e1-3acf4a5b7da2': [P.nadia, P.teresa, P.dan],
  'f72ce188-8e8b-4c8f-b03b-365d4f41303b': [P.nadia, P.owen, P.dan, P.marcusH],
  '8c9a7c16-d51d-4d3d-8ff8-46e32d7b2d3e': [P.nadia, P.dan, P.simone, P.owen],
  'e0f0f96d-d080-4a49-b0f2-1d29c4c7f555': [P.owen, P.marcusH, P.teresa, P.dan],
  '947d65a7-7a92-4412-a852-3d50b99570a2': [P.nadia, P.teresa, P.owen, P.simone],
  'cf60b086-9524-46c2-ae1e-a481dba56502': [P.nadia, P.owen, P.simone],
  'ffa18302-47e7-4092-9e46-d4946f181abe': [P.nadia, P.marcusH, P.teresa],
  '84bcce5c-dc91-4673-8628-601ef55f7a19': [P.nadia, P.dan, P.teresa, P.simone],
  '2f05c669-5ff0-42dd-a1d5-447726cc344c': [P.nadia, P.owen, P.simone, P.dan, P.marcusH],
  '6c80f6b8-b484-40d6-9581-12715a06cc55': [P.nadia, P.owen, P.dan],
  '85bc687a-d9ef-4f1b-91e6-fc5914835fc8': [P.nadia, P.marcusH, P.owen, P.teresa],
  // HUSKY
  '647d3538-8f46-4a7f-aa66-44bf25a4e86c': [P.kim, P.ben, P.josh, P.rachel, P.eric],
  'c520567a-924c-4cfe-ad7a-482dbae64174': [P.adrienne, P.ben, P.josh, P.rachel, P.eric],
  '630560e4-30f7-434a-b2f9-a9ce288b67ba': [P.kim, P.adrienne, P.rachel, P.eric],
  '21bfecb1-dc58-41d9-a8ee-ed1dce43bf41': [P.ben, P.adrienne, P.rachel, P.josh],
  '912a6fc0-fc4b-4a12-a7f8-611054ffb0b8': [P.kim, P.adrienne, P.ben, P.josh, P.rachel],
  'b40e8185-24de-4bf3-bba2-fbebe40bb2ca': [P.adrienne, P.kim, P.ben, P.josh],
  '33436d3c-1f99-46d0-b226-f48688e88e74': [P.adrienne, P.rachel, P.josh, P.kim, P.eric],
  'a67ed0f4-8abe-4515-aa77-e97a79756b13': [P.rachel, P.adrienne, P.kim],
  '61ae1e06-33e7-4cba-9f6d-f5b06ce1acbc': [P.ben, P.josh, P.rachel, P.kim],
  'ed058173-024f-417e-a33f-f2f85fde74ce': [P.adrienne, P.rachel, P.kim, P.ben, P.eric, P.josh],
  'f5ede639-c3ea-4411-8d6c-9964afc36fbf': [P.adrienne, P.josh, P.kim, P.ben],
  'd7b65028-9919-4a41-84f5-2e2f36ae9cc2': [P.kim, P.adrienne, P.josh],
  'f285588c-e307-4d38-b9c3-7390ddd22fee': [P.adrienne, P.josh, P.rachel, P.kim],
  '900f8463-4e35-4b9c-80e6-41acbab04a92': [P.adrienne, P.rachel, P.ben],
  // GOLDEN DOODLE
  'b2af5d7b-9d6c-4de6-b3c8-2c893bbff9a8': [P.jess, P.priyaS, P.kevin, P.diane],
  '12df68d0-e90b-4cd4-8743-c80a46a4c76f': [P.tyler, P.jess, P.kevin, P.priyaS],
  '7c4dc3f3-c774-4c6b-b5ef-13c17258fb27': [P.tyler, P.jess, P.priyaS, P.diane, P.kevin],
  '1ff02250-d3c6-4d30-8704-bb9178964c4c': [P.tyler, P.priyaS, P.diane],
  '7a0ce65e-6aad-47a6-8808-09021e660a39': [P.tyler, P.jess, P.kevin, P.diane],
  '7c9f7917-717a-4a55-951c-5ab8af37cf1f': [P.tyler, P.priyaS, P.jess, P.kevin],
  '402a6150-afa2-4ef7-9aaf-1057cd1c8136': [P.tyler, P.priyaS, P.kevin, P.diane, P.jess],
  'aa929f7c-b376-4e7f-ad9f-2e02d1f5294b': [P.tyler, P.priyaS, P.jess],
  '41166b3a-def7-4760-8b33-3397180661b5': [P.tyler, P.kevin, P.jess, P.diane],
  'f6fd851e-01db-447d-a18d-e053c7d42dc9': [P.priyaS, P.diane, P.kevin],
  'db19ff5d-f948-4a20-9158-3d85f8fa2cf0': [P.tyler, P.priyaS, P.jess, P.diane],
  'dd85fabe-a4e8-4381-b515-87e638cc6074': [P.tyler, P.priyaS, P.kevin],
  '881051cc-c176-4c38-b524-815909f661f5': [P.tyler, P.jess, P.kevin, P.diane],
  '21edd00d-e8a6-4766-a49d-76f5fdb6af50': [P.priyaS, P.diane, P.kevin, P.tyler],
  // GOLDEN RETRIEVER
  'f15b8e18-955e-4ae0-8e53-7e958c0aeed8': [P.garrett, P.yuki, P.sam, P.brooke, P.mia],
  '110c7798-93c6-43b1-a4c9-911cd35ea365': [P.ana, P.yuki, P.garrett],
  '320318e9-d6f5-476a-9657-a62495a559f3': [P.ana, P.yuki, P.sam, P.mia],
  '7a997bc4-db75-4a9a-8e40-ed8def911e49': [P.ana, P.yuki, P.sam, P.garrett, P.mia],
  '005bba56-d3c2-411f-88b8-7ebafb2ecf8d': [P.ana, P.garrett, P.sam, P.brooke, P.mia],
  '51f15c9d-45f4-4aee-a143-6467b26e3313': [P.ana, P.garrett, P.yuki, P.brooke, P.mia],
  'e4c656d3-3b2a-4e36-bded-29db34111577': [P.sam, P.garrett, P.brooke, P.yuki, P.mia],
  'a8ffed3a-85ff-4b77-bf93-a90577c5f85f': [P.ana, P.brooke, P.mia, P.yuki],
  'c5af1ac3-a29f-4e4f-a450-53a244968a54': [P.ana, P.garrett, P.yuki, P.brooke],
  'a0774b4f-d5a7-4cc9-9e9d-29a5df111e85': [P.ana, P.yuki, P.garrett, P.sam, P.brooke],
  'dc282675-fe97-4b87-8427-d3adb7bf0edc': [P.ana, P.brooke, P.yuki],
  '36a5db88-a8a6-477d-9841-c4578ee64ef8': [P.ana, P.yuki, P.brooke, P.garrett, P.mia],
  '67684707-acac-4082-b496-571477d1c14c': [P.ana, P.yuki, P.sam, P.garrett],
  // MIXED BREED
  'd54ef66c-de23-4348-be47-1d582f41a3e8': [P.naomi, P.theo, P.rosie, P.jordan, P.leila],
  'b8716980-6a8d-46c9-a9c8-4a948bcbeab9': [P.paloma, P.jordan, P.theo, P.rosie],
  '5de0e641-bfab-4d79-82af-d2c7442d5255': [P.cal, P.rosie, P.leila],
  'b46f1284-a28b-4c80-8ff4-9d59ff6ddb3a': [P.paloma, P.jordan, P.theo, P.naomi],
  '9f600fa9-7b6c-48f2-964b-f05f14097629': [P.leila, P.paloma, P.rosie, P.theo, P.cal, P.jordan],
  '03a72971-8252-455a-819b-f71cd3c45a07': [P.paloma, P.cal, P.rosie, P.naomi],
  '7cd6a8e2-78fd-4827-ba90-19e8562d7d1b': [P.cal, P.naomi, P.rosie, P.leila],
  '3d04ee75-858e-4265-bdbc-666a2b57b465': [P.paloma, P.rosie, P.naomi, P.theo, P.leila, P.jordan],
  '41687c70-65e1-4da3-9cea-51576065a659': [P.paloma, P.naomi, P.theo, P.jordan],
  '7ebb1355-2bad-4375-9f70-efdd494a3877': [P.paloma, P.rosie, P.leila, P.cal, P.theo],
  '7abdd267-7565-4fd7-b5a3-5a5b731a25e1': [P.rosie, P.jordan, P.naomi],
  '32ae0e26-b920-4705-9583-179e41f8e0b3': [P.paloma, P.jordan, P.naomi, P.rosie, P.theo],
  '68fc71a9-3b8a-49ad-8a4b-1062429bd5a8': [P.paloma, P.jordan, P.theo, P.rosie],
  // PUG
  'e068d958-3095-4b50-97ee-7a78663c263d': [P.pete, P.marco, P.steph, P.david, P.carla],
  'dbc558e8-51e1-4e10-b6b4-cf7199c63c25': [P.liz, P.steph, P.marco, P.carla],
  '757e8d90-9bc8-40fb-b33e-317805d24c58': [P.liz, P.pete, P.carla, P.steph, P.marco],
  '9595a1cd-49ca-4217-8d01-f2023e9f12cd': [P.liz, P.pete, P.marco, P.steph],
  'a913fb53-e5ce-4e19-8e8a-573af36fbb78': [P.steph, P.david, P.liz, P.carla],
  'f5b936e2-0025-42bd-b6d1-a19cbe672a20': [P.liz, P.marco, P.carla],
  '7a7311ac-a586-4120-8bdd-c8a23d5b4352': [P.steph, P.pete, P.david, P.carla],
  '0259037d-8d4e-4e57-a27e-fdf960470bc8': [P.liz, P.marco, P.steph, P.david, P.pete],
  'f9aad179-d237-494c-ac5b-deac648a73bc': [P.liz, P.steph, P.david, P.carla],
  'f5c2de6c-51e1-4bc3-ac49-5707abab6f26': [P.liz, P.pete, P.david],
  'ed313d7c-c5ea-4997-a33d-ea4b7344a522': [P.pete, P.steph, P.david, P.carla],
  '2f4afa4d-4baf-4441-a33b-d066d713d344': [P.liz, P.steph, P.pete, P.marco],
  '8473e82e-1334-45ce-8f71-58484b322fc4': [P.liz, P.carla, P.marco, P.david],
  'ed95083d-1baa-4cfc-84ec-a15baf6d7801': [P.marco, P.liz, P.carla],
  '32ae8e23-cd3c-4cf6-a642-ce3bb6dda1c5': [P.marco, P.david, P.carla, P.pete],
  // FRENCH BULLDOG
  '28f8b935-9e5e-42c7-a242-991ada00003c': [P.nina, P.claire, P.tommy, P.wendy],
  'd8f55f1f-3c66-4622-a6b9-c2caba53cc2b': [P.ryan, P.tommy, P.wendy, P.greg, P.claire],
  'fabea6d1-a142-4deb-b234-a0b56eba7516': [P.ryan, P.wendy, P.nina, P.claire, P.greg],
  '8c5d2392-e573-4701-aca8-56fd3b874450': [P.nina, P.ryan, P.tommy, P.wendy, P.greg],
  'f542dc87-5140-489e-a5ae-a689df9f0d5d': [P.ryan, P.nina, P.claire, P.tommy],
  'c368520d-5b7e-46f6-b0a0-5de6642eddfb': [P.nina, P.tommy, P.wendy, P.greg, P.claire, P.ryan],
  '8049a8a7-5323-446f-9933-d083a0c0e480': [P.ryan, P.claire, P.tommy],
  '96ea0f68-0a39-4bde-bd3e-19fd3c6add6f': [P.ryan, P.nina, P.tommy, P.claire, P.greg],
  'fa73d741-a830-4765-ac15-590c6e07728f': [P.nina, P.claire, P.tommy, P.greg, P.ryan],
  'eeb9e7ea-0bc7-472f-91ac-a365f5f8e516': [P.nina, P.ryan, P.tommy, P.wendy],
  'd094eb68-0655-4b6a-9092-3e0a8aa322dc': [P.claire, P.greg, P.ryan],
  '36563e9b-6f4d-4896-b562-7fc4ae780fff': [P.ryan, P.nina, P.tommy, P.greg],
  '179bb636-5134-4897-80a7-d304fec1fadf': [P.ryan, P.nina, P.claire, P.greg, P.tommy],
  'a2d6314a-c001-4542-9e2d-b25633dda5d4': [P.nina, P.ryan, P.wendy, P.claire],
  'ad6e7fbc-560d-446e-8963-c452d6a43be1': [P.ryan, P.tommy, P.nina],
  // PIT BULL
  'd51637c9-396c-4628-9aa9-25af860be3ad': [P.jasmine, P.marcusB, P.tanya, P.owenR, P.sofia, P.darren],
  'afc2eb2e-b6f7-4622-85e9-d228abbeb8c6': [P.keiko, P.marcusB, P.owenR, P.tanya, P.sofia, P.darren],
  '0bf0fffe-21e6-48da-a57a-2963472f89b0': [P.jasmine, P.keiko, P.sofia, P.tanya],
  '4e314025-22e2-4881-a7d3-886e15f45b95': [P.keiko, P.owenR, P.tanya, P.sofia],
  '25b3930e-405c-4144-bb72-f6065b40b332': [P.marcusB, P.keiko, P.sofia, P.owenR],
  '12896c08-ab45-4d77-bd5f-6d9d929647d2': [P.jasmine, P.tanya, P.marcusB, P.keiko],
  '88518558-2187-4806-a144-41fedd185e07': [P.keiko, P.owenR, P.tanya, P.darren, P.sofia, P.marcusB],
  '7ce023ae-4aeb-4a54-a9db-5a5095fd23e3': [P.jasmine, P.marcusB, P.keiko],
  '44df19b2-85bc-4e2d-b301-8090a0f7fdf0': [P.jasmine, P.owenR, P.sofia, P.keiko, P.tanya],
  'cf605a43-d4eb-40dd-a0ce-8ef1a75adefa': [P.jasmine, P.keiko, P.marcusB, P.tanya, P.owenR],
  '8f265bb0-a3db-4f2c-a621-a53dcee43730': [P.jasmine, P.keiko, P.tanya, P.darren],
  '9f469973-b587-4392-9cc8-afe56ef30b31': [P.jasmine, P.owenR, P.sofia, P.keiko, P.tanya],
  '92ea22c5-b311-4c45-bf44-420da25a955c': [P.jasmine, P.keiko, P.tanya],
  'd39c68f3-78ea-4781-b886-6274a4edface': [P.jasmine, P.owenR, P.keiko, P.marcusB],
  'a6d7bb05-6abf-40c3-a1c9-1ac1875269d7': [P.jasmine, P.owenR, P.keiko, P.tanya, P.marcusB],
  // LABRADOR RETRIEVER
  '04fca04d-96fa-4124-aa86-d38b8af5999d': [P.margot, P.dana, P.chrisN, P.kat, P.bex],
  '2c792eb2-2f9c-449e-a046-7f434f7531e1': [P.phil, P.margot, P.chrisN, P.kat],
  'b1517689-22e1-4848-ad51-e4812ad6a373': [P.chrisN, P.phil, P.dana, P.bex, P.kat],
  '3c17d44b-762f-4673-90b0-1ebe9cdcef46': [P.phil, P.margot, P.bex, P.kat],
  'd87163cc-0e69-4a8d-bfc0-e0bb3e90d8de': [P.margot, P.phil, P.chrisN, P.kat, P.dana],
  'f8152e37-cbb5-4668-bdd3-c9e2c5552d67': [P.dana, P.chrisN, P.bex, P.margot],
  '83390b94-703a-4e85-8505-d670265ecdf7': [P.phil, P.kat, P.bex, P.chrisN, P.margot],
  '62c1c738-8cfc-4ab2-a661-3b9b1433fc4c': [P.phil, P.dana, P.margot, P.bex, P.kat],
  'a991bb10-c7fe-4e1d-bf36-b9eb30bae975': [P.bex, P.phil, P.dana, P.chrisN],
  'de125d2c-9d15-4126-bcf3-71b6994fa973': [P.phil, P.chrisN, P.dana, P.margot],
  '01e238ac-8b0c-4def-ac49-b9bf8fa2b00c': [P.phil, P.kat, P.margot, P.dana],
  '6c0cce43-267c-4bf0-8ce2-aa1a91309b29': [P.phil, P.kat, P.margot, P.bex],
  'e0a2e88e-7068-47ef-adfd-b7736b341180': [P.dana, P.chrisN, P.bex],
  '3950906a-0422-4cee-9993-fb6fd3a251de': [P.phil, P.margot, P.dana, P.chrisN],
  '91c1d7e7-fa3d-4bf2-8adf-2e9c13b53a9f': [P.dana, P.bex, P.chrisN, P.phil],
  // LABRADOODLE
  '4d53e1a9-b55e-47ee-9a98-04411307908a': [P.amyCh, P.jason, P.rosieK, P.nick, P.lauren],
  'fff70f73-bcfc-44a6-adde-ae5d7e442939': [P.dev, P.rosieK, P.jason, P.nick],
  'c3435817-442b-4053-9b08-2680908ab2d9': [P.nick, P.lauren, P.jason, P.dev],
  '486460f8-0d10-4c8f-82c6-6c42f9bc183c': [P.dev, P.amyCh, P.rosieK, P.jason],
  '8e7d956f-133a-4c8e-aff7-c90541d22baf': [P.dev, P.amyCh, P.rosieK, P.lauren, P.nick],
  'e590490b-0720-4b9e-b2cd-964a0a902fba': [P.dev, P.nick, P.amyCh, P.jason, P.rosieK],
  '9c95b2a2-3cbe-459d-b3c0-fe8742d8b738': [P.dev, P.rosieK, P.nick, P.jason],
  'e809d22c-a7ee-4fe6-bce5-d7755021270a': [P.rosieK, P.dev, P.lauren, P.amyCh],
  '947c36e0-2080-4799-8d33-c9692c1b6b3b': [P.amyCh, P.jason, P.dev, P.rosieK],
  '1ed331ac-2336-44ee-94c7-be4934bf1613': [P.rosieK, P.jason, P.dev, P.amyCh, P.lauren],
  '2de62d17-5620-4068-952d-7ad80110a7e6': [P.dev, P.nick, P.jason, P.rosieK],
  '78add832-978d-4a38-89d9-1127e6ace6cc': [P.amyCh, P.rosieK, P.jason, P.dev],
  '90dd749c-f9ec-4c64-985c-0690af131bf3': [P.dev, P.amyCh, P.nick, P.jason],
  'bcbff77a-fa42-46cd-9e13-d8df6b58803a': [P.amyCh, P.nick, P.jason, P.rosieK, P.lauren],
  '3d1a9513-9c33-45a6-ba76-9d41da5b6154': [P.dev, P.amyCh, P.nick, P.lauren, P.jason],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Comments ────────────────────────────────────────────────────────────────
  console.log('\n💬 Inserting comments...');
  let commentInserted = 0;
  let commentSkipped = 0;
  let commentFailed = 0;

  for (const c of COMMENTS) {
    const { data: existing } = await supabase
      .from('comments')
      .select('id')
      .eq('post_id', c.post_id)
      .eq('author_id', c.author_id)
      .eq('content_text', c.content_text)
      .maybeSingle();

    if (existing) {
      commentSkipped++;
      continue;
    }

    const { error } = await supabase.from('comments').insert({
      post_id:      c.post_id,
      author_id:    c.author_id,
      content_text: c.content_text,
      created_at:   c.created_at,
    });

    if (error) {
      console.error(`  ✗ Comment failed (post ${c.post_id.slice(0, 8)}): ${error.message}`);
      commentFailed++;
    } else {
      commentInserted++;
    }
  }

  console.log(`  Inserted: ${commentInserted}  Skipped: ${commentSkipped}  Failed: ${commentFailed}`);

  // ── Reactions ────────────────────────────────────────────────────────────────
  console.log('\n👍 Inserting reactions...');

  const allReactions: Array<{ post_id: string; user_id: string; reaction_type: string; created_at: string }> = [];

  let postIndex = 0;
  for (const [post_id, user_ids] of Object.entries(POST_REACTIONS)) {
    for (let i = 0; i < user_ids.length; i++) {
      allReactions.push({
        post_id,
        user_id: user_ids[i],
        reaction_type: 'LIKE',
        // Stagger: faster for earlier posts (meetups/stories), spread over a few hours
        created_at: ts(Math.max(5, 8 + postIndex % 7 + i * 12)),
      });
    }
    postIndex++;
  }

  const BATCH = 50;
  let reactionInserted = 0;
  let reactionFailed = 0;

  for (let i = 0; i < allReactions.length; i += BATCH) {
    const batch = allReactions.slice(i, i + BATCH);
    const { error, data } = await supabase
      .from('post_reactions')
      .upsert(batch, { onConflict: 'post_id,user_id', ignoreDuplicates: true })
      .select('post_id');

    if (error) {
      console.error(`  ✗ Reaction batch ${Math.floor(i / BATCH) + 1} failed: ${error.message}`);
      reactionFailed += batch.length;
    } else {
      reactionInserted += data?.length ?? 0;
    }
  }

  console.log(`  Inserted: ${reactionInserted}  Total attempted: ${allReactions.length}  Failed: ${reactionFailed}`);
  console.log('\n✅ Done.');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
