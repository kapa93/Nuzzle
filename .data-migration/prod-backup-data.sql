SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict vaBrF30nFxWTC27RlwmhKNLR1TsciAdIALqY3wYYgreAo1VcifgfAgsc89iwkd4

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	458832b6-cf39-4939-9c1e-8e541a70c679	authenticated	authenticated	superduper101@gmail.com	\N	2026-06-02 06:05:24.580442+00	\N		\N		\N			\N	2026-06-04 03:40:40.707758+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "110434522364644803499", "name": "Jeff Blahblahblah", "email": "superduper101@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJA8erzJSpCBTa3g2Syigo7ciTrbn-xcYvbC_qeSm5rgf3nlw=s96-c", "full_name": "Jeff Blahblahblah", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJA8erzJSpCBTa3g2Syigo7ciTrbn-xcYvbC_qeSm5rgf3nlw=s96-c", "provider_id": "110434522364644803499", "email_verified": true, "phone_verified": false}	\N	2026-06-02 06:05:24.568751+00	2026-06-04 16:33:14.274248+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	37d86423-de1d-4fcf-8f12-ed1b18778b7f	authenticated	authenticated	myslinski90@gmail.com	\N	2026-05-12 02:51:42.579904+00	\N		\N		\N			\N	2026-05-12 02:51:42.854366+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "108073620538733248423", "name": "kapa threehunnit", "email": "myslinski90@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJydkz5qVsQYPGAwZIbStEyzSvjxpFU3JK8bEgHzt6ONBJesQ=s96-c", "full_name": "kapa threehunnit", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJydkz5qVsQYPGAwZIbStEyzSvjxpFU3JK8bEgHzt6ONBJesQ=s96-c", "provider_id": "108073620538733248423", "email_verified": true, "phone_verified": false}	\N	2026-05-12 02:51:42.567872+00	2026-05-12 02:51:42.86735+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	f9370c68-7893-4bf9-a3be-43894c8203c9	authenticated	authenticated	kacpermyslinski@gmail.com	\N	2026-06-06 18:35:35.331269+00	\N		\N		\N			\N	2026-06-06 18:35:35.736329+00	{"provider": "google", "providers": ["google"]}	{"iss": "https://accounts.google.com", "sub": "101559066405571624101", "name": "Kacper Myslinski", "email": "kacpermyslinski@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKjB_fa048owT9vSiRJ2agQFMzQ5arEAcAXbP3BQHFIaLZXUSn6=s96-c", "full_name": "Kacper Myslinski", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKjB_fa048owT9vSiRJ2agQFMzQ5arEAcAXbP3BQHFIaLZXUSn6=s96-c", "provider_id": "101559066405571624101", "email_verified": true, "phone_verified": false}	\N	2026-06-06 18:35:35.31848+00	2026-06-07 06:12:24.927813+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
108073620538733248423	37d86423-de1d-4fcf-8f12-ed1b18778b7f	{"iss": "https://accounts.google.com", "sub": "108073620538733248423", "name": "kapa threehunnit", "email": "myslinski90@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJydkz5qVsQYPGAwZIbStEyzSvjxpFU3JK8bEgHzt6ONBJesQ=s96-c", "full_name": "kapa threehunnit", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJydkz5qVsQYPGAwZIbStEyzSvjxpFU3JK8bEgHzt6ONBJesQ=s96-c", "provider_id": "108073620538733248423", "email_verified": true, "phone_verified": false}	google	2026-05-12 02:51:42.575432+00	2026-05-12 02:51:42.575483+00	2026-05-12 02:51:42.575483+00	9650219d-1cbc-476c-8dfa-6d61671eb84b
110434522364644803499	458832b6-cf39-4939-9c1e-8e541a70c679	{"iss": "https://accounts.google.com", "sub": "110434522364644803499", "name": "Jeff Blahblahblah", "email": "superduper101@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJA8erzJSpCBTa3g2Syigo7ciTrbn-xcYvbC_qeSm5rgf3nlw=s96-c", "full_name": "Jeff Blahblahblah", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJA8erzJSpCBTa3g2Syigo7ciTrbn-xcYvbC_qeSm5rgf3nlw=s96-c", "provider_id": "110434522364644803499", "email_verified": true, "phone_verified": false}	google	2026-06-02 06:05:24.576256+00	2026-06-02 06:05:24.576307+00	2026-06-04 03:40:40.428483+00	b1b8f284-2236-4c7e-bb0b-ab3361262e0a
101559066405571624101	f9370c68-7893-4bf9-a3be-43894c8203c9	{"iss": "https://accounts.google.com", "sub": "101559066405571624101", "name": "Kacper Myslinski", "email": "kacpermyslinski@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocKjB_fa048owT9vSiRJ2agQFMzQ5arEAcAXbP3BQHFIaLZXUSn6=s96-c", "full_name": "Kacper Myslinski", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocKjB_fa048owT9vSiRJ2agQFMzQ5arEAcAXbP3BQHFIaLZXUSn6=s96-c", "provider_id": "101559066405571624101", "email_verified": true, "phone_verified": false}	google	2026-06-06 18:35:35.326263+00	2026-06-06 18:35:35.326314+00	2026-06-06 18:35:35.326314+00	e9971714-efe3-4cb1-993b-df325872d4a0
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
652ad634-a53c-4d15-8457-2a58b81b2b8f	37d86423-de1d-4fcf-8f12-ed1b18778b7f	2026-05-12 02:51:42.854505+00	2026-05-12 02:51:42.854505+00	\N	aal1	\N	\N	Nuzzle/1 CFNetwork/3826.600.41.2.1 Darwin/24.6.0	68.8.33.98	\N	\N	\N	\N	\N
966a72df-2c0a-4f31-8578-24526a620db5	f9370c68-7893-4bf9-a3be-43894c8203c9	2026-06-06 18:35:35.736441+00	2026-06-07 06:12:24.93041+00	\N	aal1	\N	2026-06-07 06:12:24.930302	Nuzzle/1 CFNetwork/3860.600.12 Darwin/25.5.0	98.63.171.22	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
652ad634-a53c-4d15-8457-2a58b81b2b8f	2026-05-12 02:51:42.868+00	2026-05-12 02:51:42.868+00	oauth	1c290aee-933c-4d5e-b170-181fe50bbb45
966a72df-2c0a-4f31-8578-24526a620db5	2026-06-06 18:35:35.742135+00	2026-06-06 18:35:35.742135+00	oauth	33da5116-71f0-4565-afa5-989b0a64258e
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	1	xiaqankizsto	37d86423-de1d-4fcf-8f12-ed1b18778b7f	f	2026-05-12 02:51:42.859828+00	2026-05-12 02:51:42.859828+00	\N	652ad634-a53c-4d15-8457-2a58b81b2b8f
00000000-0000-0000-0000-000000000000	8	ylwrvfebtpxv	f9370c68-7893-4bf9-a3be-43894c8203c9	t	2026-06-06 18:35:35.73966+00	2026-06-07 06:12:24.9249+00	\N	966a72df-2c0a-4f31-8578-24526a620db5
00000000-0000-0000-0000-000000000000	9	5nzd4urmepiv	f9370c68-7893-4bf9-a3be-43894c8203c9	f	2026-06-07 06:12:24.925931+00	2026-06-07 06:12:24.925931+00	ylwrvfebtpxv	966a72df-2c0a-4f31-8578-24526a620db5
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: blocked_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."blocked_users" ("id", "blocker_id", "blocked_id", "created_at") FROM stdin;
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."places" ("id", "name", "slug", "place_type", "city", "neighborhood", "latitude", "longitude", "check_in_radius_meters", "check_in_duration_minutes", "description", "is_active", "supports_check_in", "created_at", "updated_at", "google_place_id", "photos", "status") FROM stdin;
1aba0d0c-63f7-465e-953e-ea29818e5c53	Ocean Beach Dog Beach	ocean-beach-dog-beach	dog_beach	San Diego	Ocean Beach	32.7577	-117.2523	400	60	\N	t	t	2026-04-19 03:58:02.658616+00	2026-04-19 10:19:06.2067+00	ChIJObYoTc6r3oARWZ3Y1mYb43k	{}	active
ba902f24-f660-4477-90c4-9d1a12e34aa7	Fiesta Island Dog Park	fiesta-island-dog-park	dog_park	San Diego	Mission Bay	32.775786	-117.221551	400	60	\N	t	t	2026-04-19 08:57:19.928658+00	2026-04-19 08:57:19.928658+00	ChIJ400DJH2q3oARb1bi_5oqoUA	{}	active
d634792e-4e92-4ec2-a82d-82fc6b45bd36	Montrose Dog Beach	montrose-dog-beach-tp0agx5o	dog_beach	\N	\N	41.9691277	-87.64285129999999	400	60	Montrose Dog Beach, Illinois, USA	f	f	2026-06-06 18:36:37.577941+00	2026-06-06 18:36:37.577941+00	ChIJBYMDDtzTD4gR13yTP0AgX5o	{places/ChIJBYMDDtzTD4gR13yTP0AgX5o/photos/AaVGc3lq8uvob-Y1NdBWF51LJ_pHskaJd_SM_rzpTSVCRukhSmSU88tL7jjDhCJYVoU4KzVzgTp8PXq_QSjDCb1zK0IeYInP9Hvd4coIzbkHH8sl_lYpDlrSSoihmSD4Lv6M2xc_EMKU1Eytj8Fuqy-mAbHn5JdFXF2KKlqPxTckYHhlLizGWB14ilWKPIamIpWpcgJuiwhK0hkiopwlFebckKRPsQ4MDZPmcD68JpAL-2RACD9iw4K_JiN5GOV2_PLJwg1C1AD5_wfR0ElsB0HEjtjzMHvntA6eadYIHKVFLqMqlBQoF4-KWaRCE_bC7eIr6bdp75bn4ts3QVxFBA0Tbh8_y5qd90lWmMgxrZHBpoCqA6bqIEBbCYCHETpNlKbDtIqQz-OGKw-mH-CHKmppqHr9Xo0qOcclm70lNioFuy5fXA,places/ChIJBYMDDtzTD4gR13yTP0AgX5o/photos/AaVGc3k7eUrExWixkCubeB2d7P_mkkTyCMkKmwQpF_jPF-oy2KjG_hS1wm_Ice4VU--xPgpS0sa7uxsTqbYfkB95BJdZHz6LwF0xjj70ZFs74JYHXkHOw99dpjcz8jYdlZLW_qKmbaVY0vBsu706uMwsAeocOnfr1ENjEKyc2WUEoTJBtjnzxyqNmHdW8CoZAjPVqb_5iULponorZG9ThYMt_ziQlC9n77t5JJNBouk-hc01Eqv-jMAHHnfPTKjRuONt305snV2u7q_iK7f-vQPmY9Hr7MjUeVXccNczFwr-eBJUaaAE7qrZg4SSrU8GIG0bne7WCq5aSTAACmVigk4OVLxlYCoOf-d6tjyDM9EGAg-OumV3Eu_ck19yT67kGv0Wctk83CEJ4n2Zdfr_SsDQRiu5sHW8r64-PSqGnylUQrewgO5R,places/ChIJBYMDDtzTD4gR13yTP0AgX5o/photos/AaVGc3nBe4JJwW0OD-qXTG610n0b6p8-m9PSb16Hor7tiZoJmY2y88kkfnRhtNetH78xu5nTFqkY7cknd_yTOoN2Who44tXcR1bU4xLEVMzCn7TrCC9_UI6Lynz-AMUbwjrPv2Y65EEF2056bAQn-gB7fDlcZGVV-iCZvSNeL5U8PHGitMWP5H5Xr0kgRWjWHkp5sFg-YpO0-ZyjqUNNiSDfYZ1iDC3-gWeBQHhErs-zsml6maYUy-TeRUKYlAWCLbB2XGsTsmICmq4iEPm7acEAnwibcuxvLO_-ptG-My6k-BmI1xjXG7yzxkfq1xY-m-Jl2XBwbmgM-FMxHQL7mI9lB5yJLwXgdyHDjUFH8B6kITaEyesvejZUuIFyr3Sm4es4iE3HK7EuLsdVvaFiWjjyPbfncVF5JVaG_Rii0umD_I59UMuH}	pending
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "name", "email", "city", "created_at", "updated_at", "profile_image_url", "is_admin") FROM stdin;
37d86423-de1d-4fcf-8f12-ed1b18778b7f	Jeff	myslinski90@gmail.com	San Diego	2026-05-12 02:51:42.560564+00	2026-05-12 02:54:25.103528+00	https://kpdvjbuwwrpmqgljoixw.supabase.co/storage/v1/object/public/profile-images/37d86423-de1d-4fcf-8f12-ed1b18778b7f/avatar.jpg	f
458832b6-cf39-4939-9c1e-8e541a70c679	Jeff Blahblahblah	superduper101@gmail.com	\N	2026-06-02 06:05:24.55971+00	2026-06-02 06:05:25.035526+00	\N	f
f9370c68-7893-4bf9-a3be-43894c8203c9	Kacper Myslinski	kacpermyslinski@gmail.com	\N	2026-06-06 18:35:35.312238+00	2026-06-06 18:35:35.312238+00	\N	f
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."posts" ("id", "author_id", "breed", "type", "tag", "content_text", "title", "created_at", "updated_at", "place_id") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."comments" ("id", "post_id", "author_id", "content_text", "created_at") FROM stdin;
\.


--
-- Data for Name: comment_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."comment_reactions" ("comment_id", "user_id", "reaction_type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: dogs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dogs" ("id", "owner_id", "name", "breed", "age_group", "energy_level", "dog_image_url", "created_at", "updated_at", "dog_friendliness", "play_style", "good_with_puppies", "good_with_large_dogs", "good_with_small_dogs", "temperament_notes") FROM stdin;
81058dd9-55b3-4de3-a692-fc8ef7826354	37d86423-de1d-4fcf-8f12-ed1b18778b7f	Lucy	AUSTRALIAN_SHEPHERD	ADULT	MED	https://kpdvjbuwwrpmqgljoixw.supabase.co/storage/v1/object/public/dog-images/37d86423-de1d-4fcf-8f12-ed1b18778b7f/dogs/81058dd9-55b3-4de3-a692-fc8ef7826354/c24b39fc-a186-41de-90b2-85f08d5ef6b2.jpg	2026-05-12 02:52:26.779036+00	2026-05-12 02:52:29.021118+00	5	gentle	yes	yes	yes	\N
\.


--
-- Data for Name: dog_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dog_interactions" ("id", "dog_id_1", "dog_id_2", "created_by_user_id", "location_name", "source_type", "created_at") FROM stdin;
\.


--
-- Data for Name: dog_location_checkins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dog_location_checkins" ("id", "user_id", "dog_id", "location_key", "location_name", "created_at", "expires_at", "ended_at", "place_id") FROM stdin;
\.


--
-- Data for Name: dog_spot_vibe_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dog_spot_vibe_options" ("id", "key", "label", "icon", "sort_order", "is_active", "created_at") FROM stdin;
95f89647-9036-4717-8557-193c90acb18e	water_bowls	Water bowls	water-outline	1	t	2026-05-22 00:37:46.244326+00
57a9bfaf-57a4-4ab3-a6b3-a371aef3c481	dog_friendly_patio	Dog-friendly patio	umbrella-outline	2	t	2026-05-22 00:37:46.244326+00
61632196-73c9-4576-880d-405c4e8c9ac5	gives_treats	Gives treats	gift-outline	3	t	2026-05-22 00:37:46.244326+00
10f607b6-c009-49d3-86cb-45d663cb52d6	dog_friendly_staff	Dog-friendly staff	people-outline	4	t	2026-05-22 00:37:46.244326+00
e2f3c773-cd49-4d05-a60b-98a287955d8b	quiet	Quiet	leaf-outline	5	t	2026-05-22 00:37:46.244326+00
654fec99-a17e-474d-a276-ce0202ff17e9	shady_seating	Shady seating	partly-sunny-outline	6	t	2026-05-22 00:37:46.244326+00
de8e85d9-4d84-4537-83b1-c0820b93c4ac	spacious_patio	Spacious patio	expand-outline	7	t	2026-05-22 00:37:46.244326+00
0b4fa73e-d9bc-4ec9-911e-687c5e4991e6	good_for_small_dogs	Good for small dogs	paw-outline	8	t	2026-05-22 00:37:46.244326+00
6b3afb6d-fe90-4b48-b80a-cbeddd602450	good_for_social_dogs	Good for social dogs	happy-outline	9	t	2026-05-22 00:37:46.244326+00
804f58c2-505b-4bc2-a172-fa58e0920e7f	usually_busy	Usually busy	trending-up-outline	10	t	2026-05-22 00:37:46.244326+00
50442fe1-f3a4-4cea-861e-d540805c53a6	loud	Loud	volume-high-outline	11	t	2026-05-22 00:37:46.244326+00
2ff4575c-91bb-42b6-a128-5a9a31aecaa8	limited_parking	Limited parking	car-outline	12	t	2026-05-22 00:37:46.244326+00
\.


--
-- Data for Name: dog_spot_vibes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."dog_spot_vibes" ("id", "google_place_id", "vibe_option_id", "user_id", "created_at") FROM stdin;
28d9cec6-21cb-4385-ac1a-5ebb9e14d0a3	ChIJo0X6wDiq3oAR9flffppY1X4	95f89647-9036-4717-8557-193c90acb18e	458832b6-cf39-4939-9c1e-8e541a70c679	2026-06-02 06:25:49.429909+00
9eb3dd65-a7fa-4783-a440-3dbc2e113c10	ChIJo0X6wDiq3oAR9flffppY1X4	654fec99-a17e-474d-a276-ce0202ff17e9	458832b6-cf39-4939-9c1e-8e541a70c679	2026-06-02 06:25:50.909813+00
\.


--
-- Data for Name: meetup_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."meetup_details" ("post_id", "location_name", "start_time", "end_time", "meetup_kind", "spots_available", "host_notes", "is_recurring_seeded", "created_at", "updated_at", "place_id") FROM stdin;
\.


--
-- Data for Name: meetup_rsvps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."meetup_rsvps" ("id", "meetup_post_id", "user_id", "created_at") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."notifications" ("id", "user_id", "actor_id", "type", "post_id", "comment_id", "created_at", "read_at", "dog_interaction_id", "place_id") FROM stdin;
\.


--
-- Data for Name: place_community_interests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."place_community_interests" ("id", "place_id", "user_id", "created_at") FROM stdin;
fa743dfa-5915-41a6-a622-1e94f11746dc	d634792e-4e92-4ec2-a82d-82fc6b45bd36	f9370c68-7893-4bf9-a3be-43894c8203c9	2026-06-06 18:36:37.802874+00
\.


--
-- Data for Name: post_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."post_images" ("id", "post_id", "image_url", "sort_order", "created_at") FROM stdin;
\.


--
-- Data for Name: post_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."post_reactions" ("post_id", "user_id", "reaction_type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: push_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."push_tokens" ("id", "user_id", "token", "platform", "created_at") FROM stdin;
f31c030b-cddf-4e85-88aa-d609508e0ec5	458832b6-cf39-4939-9c1e-8e541a70c679	ExponentPushToken[ibKl8xKzla88XKTNmfO0JR]	ios	2026-06-04 16:33:14.614698+00
1be7c979-5105-4f3f-b057-c2c4a11a0056	f9370c68-7893-4bf9-a3be-43894c8203c9	ExponentPushToken[ibKl8xKzla88XKTNmfO0JR]	ios	2026-06-06 18:35:36.441176+00
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."reports" ("id", "reporter_id", "reportable_type", "reportable_id", "reason", "created_at", "status") FROM stdin;
\.


--
-- Data for Name: user_breed_joins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_breed_joins" ("user_id", "breed", "created_at") FROM stdin;
37d86423-de1d-4fcf-8f12-ed1b18778b7f	AUSTRALIAN_SHEPHERD	2026-05-12 02:52:29.128104+00
\.


--
-- Data for Name: user_place_saves; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."user_place_saves" ("user_id", "place_id", "created_at") FROM stdin;
458832b6-cf39-4939-9c1e-8e541a70c679	1aba0d0c-63f7-465e-953e-ea29818e5c53	2026-06-02 06:08:37.63742+00
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
dog-images	dog-images	\N	2026-04-13 01:55:00.400051+00	2026-04-13 01:55:00.400051+00	t	f	5242880	{image/jpeg,image/png,image/webp}	\N	STANDARD
post-images	post-images	\N	2026-04-13 01:55:00.400051+00	2026-04-13 01:55:00.400051+00	t	f	5242880	{image/jpeg,image/png,image/webp}	\N	STANDARD
profile-images	profile-images	\N	2026-04-13 01:55:00.608111+00	2026-04-13 01:55:00.608111+00	t	f	5242880	{image/jpeg,image/png,image/webp}	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
e4ab849c-fc75-4ad8-8e07-20b0d179ba85	dog-images	37d86423-de1d-4fcf-8f12-ed1b18778b7f/dogs/81058dd9-55b3-4de3-a692-fc8ef7826354/c24b39fc-a186-41de-90b2-85f08d5ef6b2.jpg	37d86423-de1d-4fcf-8f12-ed1b18778b7f	2026-05-12 02:52:28.554395+00	2026-05-12 02:52:28.554395+00	2026-05-12 02:52:28.554395+00	{"eTag": "\\"b19d97a05ff299b8b8e9031c16ac20ef\\"", "size": 3442177, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-12T02:52:29.000Z", "contentLength": 3442177, "httpStatusCode": 200}	dea3d020-70c2-40d9-aee3-0e935bc24738	37d86423-de1d-4fcf-8f12-ed1b18778b7f	{}
cb9ba44d-1c1f-4742-9e32-1361f2c28a9b	profile-images	37d86423-de1d-4fcf-8f12-ed1b18778b7f/avatar.jpg	37d86423-de1d-4fcf-8f12-ed1b18778b7f	2026-05-12 02:54:17.610179+00	2026-05-12 02:54:17.610179+00	2026-05-12 02:54:17.610179+00	{"eTag": "\\"12388b48ce7e0cdf1d4cd058d059021b\\"", "size": 506651, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-12T02:54:18.000Z", "contentLength": 506651, "httpStatusCode": 200}	fea15699-f387-4b70-94c1-ca288e8348b1	37d86423-de1d-4fcf-8f12-ed1b18778b7f	{}
8fd78587-bf9d-4639-a28b-876c3af2ad55	dog-images	brand/nuzzle-logo.png	\N	2026-05-14 18:56:36.313278+00	2026-05-14 18:56:36.313278+00	2026-05-14 18:56:36.313278+00	{"eTag": "\\"5f47c668b7d638800cd21cb30bc59f0e\\"", "size": 64206, "mimetype": "image/png", "cacheControl": "no-cache", "lastModified": "2026-05-14T18:56:37.000Z", "contentLength": 64206, "httpStatusCode": 200}	76c09dbf-eb34-4dbf-8303-7b7ff1e0e38d	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 9, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict vaBrF30nFxWTC27RlwmhKNLR1TsciAdIALqY3wYYgreAo1VcifgfAgsc89iwkd4

RESET ALL;
