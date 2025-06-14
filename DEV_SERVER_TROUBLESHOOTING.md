# Development Server Troubleshooting Guide

## 🚀 Quick Start Commands

### Start Development Server (Recommended)
```bash
npm run dev:safe
```
This command automatically kills any existing processes on port 3001 and starts the server.

### Alternative Port Commands
```bash
npm run dev:3001    # Start on port 3001
npm run dev:3002    # Start on port 3002
npm run dev         # Start on default port (5173)
```

### Show Testing URLs
```bash
npm run test-ui
```

## 🔧 Port Conflict Resolution

### 1. Check What's Using a Port
```bash
lsof -ti:8080       # Check port 8080
lsof -ti:3001       # Check port 3001
```

### 2. Kill Processes on Specific Port
```bash
# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9

# Kill processes on port 3001
lsof -ti:3001 | xargs kill -9
```

### 3. Using the Dev Server Manager Script
```bash
# Make executable (first time only)
chmod +x dev-server-manager.sh

# Start server
./dev-server-manager.sh start

# Start on specific port
./dev-server-manager.sh start 3002

# Stop processes on port
./dev-server-manager.sh stop 8080

# Check port availability
./dev-server-manager.sh check 3001
```

## 🎯 Testing the UI Redesign

Once the server is running on port 3001, test these URLs:

### Main Testing Pages
- **Main App**: http://localhost:3001/
- **Button Showcase**: http://localhost:3001/showcase
- **Comprehensive UI Test**: http://localhost:3001/ui-test

### What to Test

#### 1. **Dark Orange Theme (#B1420A)**
- ✅ Primary color should be dark orange throughout
- ✅ Accent color should be peru (#D2691E)
- ✅ Positive actions should have green glow
- ✅ Negative actions should have red glow

#### 2. **Poppins Typography**
- ✅ All text should use Poppins font family
- ✅ Headings should be bold with proper weights
- ✅ Body text should be readable and consistent

#### 3. **3D Button Effects**
- ✅ Buttons should have ambient glow on hover
- ✅ Scale animation (1.02x) on hover
- ✅ Proper shadow effects with color-specific glows
- ✅ Smooth transitions (200ms duration)

#### 4. **Theme Toggle**
- ✅ Available in Settings page
- ✅ Switches between dark and light themes
- ✅ Persists across page refreshes
- ✅ Updates all components consistently

#### 5. **Enhanced Components**
- ✅ Cards have ambient lighting effects
- ✅ Forms have focus glow states
- ✅ Modals have frosted glass backdrop
- ✅ Navigation has enhanced styling

#### 6. **Performance**
- ✅ Smooth 60fps animations
- ✅ No lag during interactions
- ✅ Fast page load times
- ✅ Responsive on mobile devices

## 🐛 Common Issues & Solutions

### Issue: "Port 8080 is already in use"
**Solution:**
```bash
# Kill processes on port 8080
lsof -ti:8080 | xargs kill -9

# Start on different port
npm run dev:3001
```

### Issue: "EADDRINUSE: address already in use"
**Solution:**
```bash
# Use the safe start command
npm run dev:safe

# Or manually kill and restart
lsof -ti:3001 | xargs kill -9 && npm run dev:3001
```

### Issue: Server starts but pages don't load
**Solution:**
1. Check browser console for errors
2. Verify the correct URL: http://localhost:3001/
3. Clear browser cache and reload
4. Check if firewall is blocking the port

### Issue: UI changes not visible
**Solution:**
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Check if CSS is loading properly
4. Verify Tailwind classes are being applied

### Issue: Fonts not loading (Poppins)
**Solution:**
1. Check internet connection (Google Fonts)
2. Verify font import in index.css
3. Check browser developer tools for font loading errors
4. Clear browser cache

## 📊 Performance Monitoring

### Check Performance Metrics
Open browser developer tools and run:
```javascript
// In browser console
import('/src/utils/performanceValidation.ts').then(module => {
  module.default.runPerformanceValidation();
});
```

### Expected Performance Metrics
- **Render Time**: <16ms (60fps)
- **Memory Usage**: <80% of allocated heap
- **Animation FPS**: 55+ fps sustained
- **Button Interaction**: <1ms average response

## 🔄 Development Workflow

### 1. Start Development
```bash
npm run dev:safe
```

### 2. Open Testing Pages
- Main: http://localhost:3001/
- Showcase: http://localhost:3001/showcase
- UI Test: http://localhost:3001/ui-test

### 3. Test Features
- Theme toggle functionality
- Button interactions and glow effects
- Form component focus states
- Modal backdrop blur effects
- Navigation enhancements

### 4. Performance Validation
- Check smooth animations
- Verify 60fps performance
- Test on mobile devices
- Validate cross-browser compatibility

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Verify all dependencies are installed: `npm install`
3. Try clearing node_modules and reinstalling: `rm -rf node_modules && npm install`
4. Check if the issue persists in incognito/private browsing mode
5. Test on a different browser

## 🎉 Success Indicators

You'll know the UI redesign is working correctly when:

- ✅ Server starts without port conflicts
- ✅ All testing pages load successfully
- ✅ Dark orange theme is visible throughout
- ✅ Poppins font is rendering correctly
- ✅ Button hover effects show ambient glow
- ✅ Theme toggle works in Settings
- ✅ Performance is smooth and responsive

**The comprehensive UI redesign implementation is complete and ready for testing!**
