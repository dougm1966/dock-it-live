# PCPL ScoreBoard Image Upload Analysis

## Current Image Upload Locations & Storage

### 1. Player Photos (2 locations)
**HTML Elements:**
- `FileUploadP1Photo` (line 57 in control_panel.html)
- `FileUploadP2Photo` (line 70 in control_panel.html)

**Storage Keys:**
- `player1_photo` (localStorage)
- `player2_photo` (localStorage)

**Functions:**
- `playerPhotoPost(input, player)` (lines 131-151 in control_panel.js)
- `deletePlayerPhoto(player, event)` (lines 153-171 in control_panel.js)

**Display Size:** 30px height, 70px max-width, circular (border-radius: 50%)

**Accepted Formats:** PNG, JPEG, SVG, BMP

---

### 2. Left Sponsor Logo (1 location)
**HTML Element:**
- `FileUploadL0` (line 194 in control_panel.html)

**Storage Key:**
- `leftSponsorLogo` (localStorage)

**Function:**
- `logoPost(input, xL)` where xL=0 (lines 86-129 in control_panel.js)

**Display:** Full-size display on scoreboard

**Accepted Formats:** PNG, JPEG, SVG, BMP

---

### 3. Right Sponsor Logo (1 location)
**HTML Element:**
- `FileUploadL4` (line 200 in control_panel.html)

**Storage Key:**
- `rightSponsorLogo` (localStorage)

**Function:**
- `logoPost(input, xL)` where xL=4 (lines 86-129 in control_panel.js)

**Display:** Full-size display on scoreboard

**Accepted Formats:** PNG, JPEG, SVG, BMP

---

### 4. Sponsor Slideshow Logos (3 locations)
**HTML Elements:**
- `FileUploadL1` (line 218 in control_panel.html)
- `FileUploadL2` (line 223 in control_panel.html)
- `FileUploadL3` (line 228 in control_panel.html)

**Storage Keys:**
- `customLogo1` (localStorage)
- `customLogo2` (localStorage)
- `customLogo3` (localStorage)

**Function:**
- `logoPost(input, xL)` where xL=1,2,3 (lines 86-129 in control_panel.js)

**Display Size:** 30px height, 70px max-width (tooltip preview)

**Accepted Formats:** PNG, JPEG, SVG, BMP

---

### 5. Browser Compact Custom Logo (1 location)
**Storage Key:**
- `customImage` (localStorage)

**Function:**
- `loadLogo()` in browser_compact/ui.js (lines 174-179)

**Note:** Different from browser_source implementation

---

## Current Storage Constraints

### localStorage Limitations
- **Chrome/Edge:** ~5-10 MB total quota
- **Firefox:** ~5 MB total quota
- **Safari:** ~5 MB total quota

### Base64 Encoding Overhead
- Images converted to base64 increase file size by ~33%
- A 2.27MB image becomes ~3.02MB in localStorage

### Current Maximum File Size
- **Documented:** 2.4MB (line 191 in control_panel.html)
- **Actual:** Limited by remaining localStorage space
- **Error Trigger:** When localStorage quota is exceeded

### Error Handling
```javascript
catch(err) { alert("the selected image exceedes the maximium file size");}
```
- Generic error message
- No specific file size validation
- No remaining space indication

---

## Future Advertising System Requirements

### Proposed Additional Image Locations (8-12 images)
**Suggested Storage Keys:**
- `sponsorAd1` through `sponsorAd12`
- Or `sponsorAd_${index}` pattern

**Potential Display Locations:**
1. **Between games** - Full screen sponsor ads
2. **Scoreboard overlays** - Corner sponsor logos
3. **Break screen banners** - Horizontal sponsor strips
4. **Player intro screens** - Sponsor backgrounds

### Storage Strategy Considerations

#### Option 1: Expand localStorage Usage
- **Pros:** Simple implementation
- **Cons:** Will quickly exceed browser limits
- **Estimated Need:** 8-12 images × 2-5MB each = 16-60MB additional

#### Option 2: External Storage
- **Cloud storage** (AWS S3, Cloudinary)
- **Local file system** (Node.js backend)
- **Database storage** (MongoDB GridFS)

#### Option 3: Hybrid Approach
- **Critical logos** in localStorage (current system)
- **Advertisement images** in external storage
- **Caching strategy** for frequently used ads

#### Option 4: Image Optimization
- **Automatic compression** before storage
- **Multiple size variants** (thumbnail, full-size)
- **Format conversion** (WebP for smaller files)

---

## Recommended Immediate Actions

### 1. Improve Error Handling
- Add file size validation before upload
- Show remaining localStorage capacity
- Provide specific error messages

### 2. Add Image Compression
- Client-side compression before base64 conversion
- Automatic format optimization
- Size reduction for preview images

### 3. Storage Management
- Add localStorage usage indicator
- Implement image deletion management
- Clear unused data warnings

### 4. Future Planning
- Design external storage API
- Plan advertising system architecture
- Consider caching strategies

---

## Technical Implementation Notes

### Current Upload Flow
1. File selection via `<input type="file">`
2. FileReader converts to base64
3. localStorage.setItem() stores base64 string
4. Broadcast to browser source via BroadcastChannel
5. UI elements update with new image

### Storage Key Patterns
- Player photos: `player{number}_photo`
- Sponsor logos: `leftSponsorLogo`, `rightSponsorLogo`
- Custom logos: `customLogo{number}`
- Browser compact: `customImage`

### Display Integration
- Browser source loads from localStorage on initialization
- Real-time updates via BroadcastChannel messaging
- Different DOM elements for different image types

---

## File Size Analysis Template

For future reference, track typical file sizes:
- **Player Photos (30px × 70px):** 10-100KB compressed
- **Sponsor Logos (variable):** 50KB-2MB depending on complexity
- **Advertisement Images (full screen):** 500KB-5MB
- **Base64 Overhead:** +33% to original file size

---

*Last Updated: December 26, 2025*
*Analysis based on PCPL ScoreBoard v2.0.0*
