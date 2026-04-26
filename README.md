# KIZUNA: Fan Identity Passport

## Introduction
**KIZUNA** characterises the indestructible bond between fans and fighters. Built on the Sui Network, it represents Fan Passport 2.0—a cross-platform, evolvable Web3 dynamic identity credential. KIZUNA transforms fan engagement into exclusive on-chain assets, thoroughly resolving ONE Championship's pain point of lacking direct fan data in the Japanese market.

## Pain Points Solved
Currently, ONE Championship's broadcasting in Japan relies heavily on U-NEXT, resulting in the official organisation being unable to directly reach fans and build long-term loyalty. KIZUNA introduces a frictionless, cashless prediction mechanism (Pick'em) and location-based check-ins, allowing fans to accumulate "Honor XP". This approach not only fully complies with Japanese regulations but also significantly strengthens the sense of belonging amongst local fans.

## System Architecture
The platform is designed with a modern, decentralised architecture leveraging the Sui Network:
*   **Frontend**: Next.js App Router for a seamless, highly responsive user interface, featuring native SVG integrations for high-quality branding.
*   **Authentication**: Sui zkLogin facilitates frictionless onboarding. Fans simply log in using familiar social accounts (Google, LINE), completely removing the hurdle of managing wallet private keys.
*   **Smart Contracts**: Move smart contracts on Sui manage the creation, evolution, and verification of the Dynamic NFTs (Soulbound Tokens) representing the fan passports.

## Core Features
*   **Absolute Data Ownership**: All interaction records and Honor XP are inextricably linked to the fan's on-chain wallet (or zkLogin account), ensuring the data genuinely belongs to them. Even if a specific platform ceases operations, the assets and history persist indefinitely on the blockchain, eliminating the risk of platform lock-in and long-term operational dilemmas.
*   **Cross-Platform Asset Autonomy**: KIZUNA seamlessly bridges U-NEXT, the official ONE App, and physical dojos, shattering the data silos of the Web2 era.
*   **Frictionless Onboarding (zkLogin)**: Zero crypto knowledge required. Users can dive straight into the ecosystem using their existing Web2 social identities.
*   **Dynamic Evolution (Dynamic NFT)**: A fan's check-ins and prediction records are updated in real-time on their KIZUNA passport attributes. The asset "evolves" in tandem with the fan's engagement, unlocking exclusive privileges.
*   **Cashless Pick'em Predictions**: A legally compliant prediction module that gamifies the fan experience without involving real-money gambling, accumulating non-transferable Honor XP.

## Sybil Resistance & KYC Gate (Design Decision)

Passports are minted **only** through an admin-held `MintCap`, not by user self-serve. This is deliberate, not a placeholder limitation:

*   **Soulbound ≠ sybil-proof.** The `key`-only, no-`store` ability prevents *transfers* but does not prevent the same human from spinning up dozens of zkLogin or fresh wallet addresses and minting one passport per address. Without a mint-side gate, the leaderboard, XP economy, and "verifiable hit rate" credential all collapse into noise.
*   **KYC / ticket binding lives off-chain, by design.** Real-world fan identity (U-NEXT account, ticket QR scanned at the venue, OAuth issuer whitelist) is verified by the operator before they call `mint`. The Move contract stays minimal and jurisdiction-neutral; the regulated step happens where regulation already operates.
*   **Upgrade path is non-breaking.** `MintCap` is a capability object, not hard-coded admin logic. The roadmap replaces the operator step with a `mint_with_proof` entrypoint that verifies a zkLogin JWT and a ticket-NFT ownership proof on-chain, then burns the legacy `MintCap`. Existing passports, XP, and tiers are untouched.
*   **Result:** one passport per real fan, a leaderboard sponsors can actually trust, and a credible "Day-One supporter vs. drive-by follower" credential — which is the entire commercial proposition.

## Roadmap

*   **AI-Generated Fighter Portraits**: The passport card currently ships with tier-based preset portraits (Rookie / Samurai / Ronin / Shogun / Legend) and a flippable back face embedding the holder's personal avatar. The next iteration integrates a generative-image pipeline (e.g. FAL flux-schnell / Replicate SDXL) prompted by tier, streak and fighter affiliation. Generated portraits are persisted to **Walrus**, Sui's native decentralised blob storage, and the `blob_id` is written back to the Passport object — giving every fan a fully on-chain, non-transferable avatar with zero reliance on centralised CDNs.
*   **Dynamic Tier Artwork**: Tier upgrades trigger a fresh portrait generation, so the passport literally evolves as the fan climbs from Rookie to Legend.
*   **Stadium Check-ins & Merch Gating**: Physical event attendance and tier-gated merch drops, all verifiable against the same passport.

## Target Audience & Strategy
*   **Target Audience**: The expansive fan base of ONE Championship in Japan.
*   **Go-To-Market Strategy**: Distributing free QR codes on U-NEXT broadcasting pages and at physical event venues for fans to claim their passports. This, combined with the cashless Pick'em prediction module, serves as the most commercially impactful MVP for the hackathon.
