# 📧 Email Template Builder

A professional, fully-featured email template builder created using only HTML, CSS, and vanilla JavaScript (no frameworks).

## ✨ Features

### Content Editing

- **Title Editor**: Customize title text, color, font size, and alignment
- **Body Text Editor**: Edit body content with color, size, and alignment options
- **Button Customization**: Configure button text, link, colors, and alignment
- **Image Support**: Select from image library or enter custom image URL
- **Background Color**: Customize email background color

### Real-Time Preview

- **Live Preview**: All changes update instantly in the preview panel
- **Email-Safe HTML**: Generates email-compatible HTML structure
- **Responsive Design**: Works on desktop and mobile devices

### Template Management

- **Save Templates**: Save your designs with custom names
- **Load Templates**: Load previously saved templates
- **Delete Templates**: Remove unwanted templates
- **Database Simulation**: Uses localStorage to simulate database storage
- **Template List**: View all saved templates with timestamps

### Export & Sharing

- **Export HTML**: Generate complete email-ready HTML code
- **Copy to Clipboard**: One-click copy functionality
- **Email-Safe Code**: Table-based layout for maximum email client compatibility

### Advanced Features

- **Color Pickers**: Visual color selection with hex code input
- **Font Size Sliders**: Adjustable font sizes with live preview
- **Alignment Options**: Left, center, and right alignment for all elements
- **Template Statistics**: View active components in your template
- **Modern UI**: Beautiful gradient design with smooth animations

## 🚀 How to Run

Simply open `index.html` in any modern web browser. No build process or dependencies required!

## 📁 File Structure

```
task/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive design
├── script.js       # All functionality and interactivity
└── README.md       # This file
```

## 🎯 Usage Guide

1. **Edit Content**: Use the left panel to customize your email template
2. **Preview**: See real-time updates in the right preview panel
3. **Save**: Enter a template name and click "Save Template"
4. **Load**: Click "Load Template" to see and load saved templates
5. **Export**: Click "Export HTML" to get the final email-ready code
6. **Clear**: Use "Clear All" to reset all fields

## 💾 Database Storage

The application uses **localStorage** to simulate database storage. All templates are saved locally in your browser. The HTML structure is stored as JSON and can be easily integrated with a real database backend.

## 🎨 Customization Options

- **Colors**: Title, body, button, button text, and background colors
- **Sizes**: Adjustable font sizes for title and body
- **Alignment**: Left, center, or right alignment for all elements
- **Images**: Choose from library or use custom URLs
- **Buttons**: Fully customizable call-to-action buttons

## 📧 Email Compatibility

The exported HTML uses:

- Table-based layout (best email client support)
- Inline CSS styles
- Email-safe HTML structure
- Responsive design principles

## 🔧 Technical Details

- **Pure JavaScript**: No frameworks or libraries
- **localStorage API**: For template persistence
- **Modern CSS**: Flexbox, Grid, and CSS animations
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Semantic HTML and proper labels

## 📝 Notes

- Templates are stored in browser localStorage
- Export HTML is ready for use in email marketing platforms
- All color inputs support both color picker and hex code entry
- Double-click a template in the list to load it quickly

---

Built with ❤️ using vanilla JavaScript
