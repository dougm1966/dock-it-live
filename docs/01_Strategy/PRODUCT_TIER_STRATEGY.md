# PRODUCT TIER STRATEGY

**Title: DOCK-IT.LIVE PRODUCT TIER STRATEGY**

## Executive Summary

Dock-It.live employs a modular freemium model that provides professional-grade broadcast scoring tools with flexible upgrade paths. The strategy ensures accessibility for entry-level streamers while capturing value from professional users and commercial organizations.

## Tier Structure

### **Free Tier (Base Product)**
**Target Audience:** Entry-level streamers, hobbyists, community leagues

**Core Features:**
- **Master Control Panel** - Central command interface for all scoring operations
- **Basic Scoring Engine**
  - Player name management
  - Score tracking and display
  - Player photo upload
  - Basic logo support
- **Browser Source Overlay** - Core rendering engine for OBS Studio
- **Local-First Architecture** - Full offline functionality via IndexedDB

**Value Proposition:** Professional-looking scoreboard without subscription costs or cloud dependencies.

---

### **Sport Modules (Add-on/Premium)**
**Target Audience:** Serious streamers, tournament directors, sport-specific broadcasters

**Available Modules:**
- **Billiards Module** ($XX)
  - Ball tracker with visual pocketed indicators
  - Shot clock with 30s/60s modes and extensions
  - Game-specific scoring (8-ball, 9-ball, straight pool)
  - Player assignment (solids/stripes)

- **Darts Module** ($XX)
  - Cricket scoring with customizable marks
  - 501/301/701 double-out support
  - Dart-specific game statistics
  - Player average tracking

- **Cornhole Module** ($XX)
  - Frame-by-frame scoring
  - Bag tracking (in-hole/on-board)
  - Cancellation scoring support
  - Tournament bracket integration

**Technical Architecture:** Each module plugs into the core engine via standardized interfaces, leveraging the Master Control Panel and overlay system.

---

### **Premium Features (Add-on)**
**Target Audience:** Commercial broadcasters, professional tournaments, sponsored content creators

**Available Add-ons:**
- **Advertising Module** ($XX)
  - 12-slot ad grid with rotation engine
  - Sponsor logo management with impression tracking
  - Custom timing and transition effects
  - Cross-module ad integration

- **Advanced Analytics** ($XX)
  - Match history and statistical analysis
  - Player performance trends
  - Sponsor impression reports
  - Export capabilities (CSV, JSON)

- **Custom Branding** ($XX)
  - White-label theme engine
  - Custom color schemes and typography
  - Branded splash screens
  - Logo replacement options

---

## Strategic Positioning

### **Market Differentiation**
- **Free Tier Advantage:** No cloud subscription required, works offline forever
- **Module Advantage:** Sport-specific features vs generic competitors
- **Premium Advantage:** Professional analytics and sponsor management

### **Competitive Response**
- **vs Basic Scoreboards:** Professional aesthetics, local reliability
- **vs Cloud Solutions:** No internet dependency, data ownership
- **vs Enterprise Systems:** Modular pricing, no enterprise contracts

### **Customer Journey**
1. **Free Tier Adoption:** Entry users experience professional quality
2. **Sport Module Upgrade:** Serious users invest in sport-specific tools
3. **Premium Feature Adoption:** Commercial users unlock business capabilities

## Technical Implementation

### **Licensing Architecture**
- **Core Engine:** Always unlocked with full functionality
- **Module Validation:** License key validation per sport module
- **Feature Flags:** Premium features controlled by activation keys
- **Offline Validation:** Local license validation with periodic online verification

### **Modular Design**
- **Core System:** `/src/core/` - Database, messaging, base UI
- **Sport Modules:** `/src/modules/[sport]/` - Game logic, specialized controls
- **Premium Features:** `/src/premium/` - Analytics, advertising, branding

### **Data Portability**
- **Free Tier:** Full data export capabilities
- **Paid Tiers:** Enhanced export with analytics and reports
- **Migration Path:** Seamless upgrade without data loss

## Revenue Model

### **Pricing Strategy**
- **Free Tier:** $0 - Drive adoption and market penetration
- **Sport Modules:** $XX per sport - One-time purchase, perpetual license
- **Premium Features:** $XX per feature - One-time purchase, perpetual license
- **Bundle Options:** Discounted sport + premium packages

### **Target Revenue Split**
- **Free Users:** 60% - Foundation for ecosystem growth
- **Sport Module Buyers:** 30% - Primary revenue source
- **Premium Feature Buyers:** 10% - High-value commercial segment

## Success Metrics

### **Adoption Metrics**
- Free tier downloads and active installations
- Sport module conversion rates from free tier
- Premium feature adoption among commercial users

### **Revenue Metrics**
- Average revenue per user (ARPU)
- Sport module mix (billiards vs darts vs cornhole)
- Premium feature attach rate

### **Engagement Metrics**
- Active tournaments per month
- Average session duration per module
- Sponsor impressions tracked (premium feature usage)

## Development Roadmap Alignment

### **Phase 1: Foundation**
- Complete free tier core functionality
- Establish module architecture and licensing framework

### **Phase 2: Sport Modules**
- Billiards module as flagship sport module
- Darts module for market expansion
- Cornhole module for diversification

### **Phase 3: Premium Features**
- Advertising module for commercial users
- Analytics engine for data-driven insights
- Custom branding for white-label opportunities

---

**Status:** Strategic Framework Established
**Next Steps:** Technical specification of licensing system and module architecture
