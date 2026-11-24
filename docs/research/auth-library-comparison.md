# Auth.js vs Better Auth for InterviewOS

Research date: November 19, 2026. Related to [#10](https://github.com/CSES-Open-Source/InterviewOS/issues/10).

**Decision (November 23, 2026):** the team chose Better Auth. Kyle agreed in review, and the EM recorded the decision on #10. Campus registration is still open.

## Recommendation

I recommend Better Auth for our new Next.js app, with Prisma and PostgreSQL. The maintainers recommend it for new projects, and both its Next.js integration and Prisma adapter fit our stack. This is a recommendation for Kyle and the EM to review, not a recorded team decision.

The library choice and campus access are separate questions. Either library still needs an approved UCSD identity-provider connection. We have not received campus registration details or tested a real UCSD login.

## Comparison

| Question | Auth.js | Better Auth |
| --- | --- | --- |
| Setup | Familiar Next.js integration, provider configuration, and an official Prisma adapter. Existing `AUTH_SECRET` notes in our repo refer to this option, but there is no auth implementation to preserve. | Configure a server instance and React client, mount a Next.js handler, and generate the auth database models. More initial setup than the current placeholder, but no migration of existing accounts is needed. |
| Next.js support | Supports Next.js route handlers and server-side sessions. | Documents App Router handlers and server-side session checks. Keep the route in the Node.js runtime for our Prisma/PostgreSQL setup. |
| Prisma support | Official `@auth/prisma-adapter`; needs the corresponding auth models and a working database. | Official Prisma adapter and schema generation. For Prisma 7, use the PostgreSQL driver adapter and the existing generated-client path. Apply migrations with Prisma, not the Better Auth direct-migration command. |
| UCSD via OIDC | A custom OIDC provider is feasible if campus supplies approved discovery information and client registration. | Generic OAuth is the documented option for a fixed provider configured in code. Register the `ucsd` provider's callback with campus. |
| UCSD via SAML | The documented BoxyHQ SAML provider relies on a SAML-to-OAuth service. Do not assume plain Auth.js consumes UCSD SAML assertions directly. | The SSO plugin supports SAML 2.0. This is a separate integration path with provider metadata, certificates, and its own callback configuration. |
| Docs and maintenance | The Better Auth team maintains Auth.js for security patches and urgent issues. Existing apps can continue using it. | The maintainers' recommended starting point for new projects, with current Next.js, Prisma, Generic OAuth, and SSO guides. |
| Cost | The open-source library has no per-user subscription fee. Database, hosting, email delivery, or an external SAML broker may cost money. | The open-source core has no per-user subscription fee. Database and hosting still cost money; check the chosen SSO package and optional hosted services separately before committing to them. |

## UCSD feasibility and the remaining unknowns

UCSD's public IAM and OIA pages identify campus Single Sign-On as an IAM service. The sources checked do **not** establish a self-service registration process, an approved issuer, credentials, or eligibility for this student project. Historical Shibboleth references are not enough to pick the current protocol.

The EM or project owner should ask UCSD ITS to route an application-integration request to IAM. The request should establish:

1. Whether a CSES student-run app can register, and whether it needs a departmental sponsor or security review.
2. Which protocol campus will provide for this app: OIDC or SAML. Get the official issuer/discovery URL or IdP metadata directly from IAM.
3. The required development and production URLs, callback URLs, HTTPS/domain requirements, and a supported way to test locally.
4. Which identity fields campus will release: a stable subject identifier, email, display name, and any affiliation or entitlement needed for student access.
5. Who is allowed to sign in: current students only, or also staff, alumni, and guests. A UCSD-looking email address alone does not establish active student status.
6. Credential/certificate ownership, rotation, logout expectations, and any restrictions on storing identity information.

**OIDC path:** configure one vetted UCSD provider, use the registered redirect URI, validate issuer/audience and the provider identity, and follow the library's state/nonce/PKCE requirements. Do not accept an issuer supplied by an arbitrary user. With Better Auth Generic OAuth and provider ID `ucsd`, the default callback is `https://<app-host>/api/auth/callback/ucsd`; campus must explicitly approve it. This is a proposed app callback, not a confirmed UCSD endpoint.

**SAML path:** use the Better Auth SSO plugin only after campus supplies the IdP metadata and registration requirements. Register the SP entity ID and ACS URL produced by that integration. Restrict provider setup to the configured campus connection; do not enable public self-registration of identity providers.

Checking possession of an `@ucsd.edu` mailbox could be a separate pilot option if the EM approves it. It must not be described as UCSD SSO or proof of current enrollment.

## Proposed CONTRIBUTING and environment changes

No auth package, runtime configuration, or database migration is added by this research. Keep the current scaffold working until implementation starts.

With Better Auth chosen:

| Variable | Proposed use |
| --- | --- |
| `DATABASE_URL` | Existing PostgreSQL connection string; keep it server-side. |
| `BETTER_AUTH_SECRET` | High-entropy auth secret, at least 32 characters. Replaces the Auth.js-specific `AUTH_SECRET` instructions. |
| `BETTER_AUTH_URL` | Explicit app origin, for example `http://localhost:3000` in development and the approved HTTPS origin in production. |
| `UCSD_OIDC_CLIENT_ID` | Proposed project variable, used only if IAM approves OIDC. |
| `UCSD_OIDC_CLIENT_SECRET` | Proposed project variable for the campus-issued confidential-client credential, if required. Server-only. |
| `UCSD_OIDC_DISCOVERY_URL` | Proposed project variable for the discovery URL supplied by IAM. Not a guessed campus URL. |

The `UCSD_*` names above are our proposed configuration names, not variables automatically recognized by Better Auth. The implementation would read them in its provider configuration. If SAML is selected, replace that OIDC block with the exact metadata/certificate fields required by the approved SAML integration.

Implementation steps to document after approval:

- Add the selected stable Better Auth package and the official Prisma/PostgreSQL adapter dependencies required by that version. Check current package documentation before installing.
- Add server-only auth and Prisma instances, the Next.js auth handler, and the React auth client.
- Generate the auth schema against the configured Prisma adapter, inspect the model diff, and create a Prisma migration. Do not re-run `prisma init` or overwrite our existing generator/output path.
- Update `.env.example` and the CONTRIBUTING variable table together. Show placeholders only; generate real secrets locally and keep them out of GitHub and Notion.
- List the exact callback URLs, approved origins, and IAM registration owner.
- Test successful campus login, rejection of an ineligible account, sign-out, expired sessions, protected routes, and incorrect callbacks using approved test accounts.

## What can be marked done

- Research and recommendation: ready for review.
- Kyle agreement: recorded in the review of #19.
- EM decision: Better Auth, recorded on #10 (November 23, 2026).
- Campus registration and real UCSD sign-in: not completed.

Issue #10 is closed now that the decision is recorded. The later implementation must separately prove that campus sign-in works.

## Sources

- [Auth.js joins Better Auth](https://better-auth.com/blog/authjs-joins-better-auth): maintenance direction and recommendation for new projects.
- [Auth.js Next.js setup](https://authjs.dev/getting-started/installation) and [Prisma adapter](https://authjs.dev/getting-started/adapters/prisma).
- [Auth.js custom OAuth provider](https://authjs.dev/guides/configuring-oauth-providers) and [BoxyHQ SAML provider](https://authjs.dev/getting-started/providers/boxyhq-saml).
- [Better Auth installation](https://better-auth.com/docs/installation), [Next.js integration](https://better-auth.com/docs/integrations/next), and [Prisma adapter](https://better-auth.com/docs/adapters/prisma).
- [Better Auth Generic OAuth](https://better-auth.com/docs/plugins/generic-oauth) and [SSO plugin](https://better-auth.com/docs/plugins/sso).
- [UCSD Identity Management](https://blink.ucsd.edu/technology/network/access/identity-management/index.html) and [Office of Information Assurance / IAM](https://blink.ucsd.edu/technology/about/structure-governance/groups/oia.html).
- [UCSD ITS support](https://support.ucsd.edu/): route the registration and eligibility questions to campus IAM.
