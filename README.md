# Credit Card Onboarding React App

A modern, responsive React application for credit card onboarding with two screens.

## Features

### Screen 1: Landing Page
- Eye-catching hero section with gradient background
- Feature highlights (instant approval, rewards, no annual fee, 24/7 support)
- Call-to-action button to start the application

### Screen 2: Customer Form
- Comprehensive customer information form with validation
- Fields include:
  - First Name & Last Name
  - Email & Phone Number
  - Date of Birth
  - Full Address (Address, City, State, Zip Code)
  - Annual Income
- Form validation with error messages
- Success confirmation after submission
- Back button to return to landing page

## Project Structure

```
src/
├── App.js              # Main app component with routing
├── App.css             # Global styles
├── index.js            # React entry point
└── pages/
    ├── LandingPage.js  # Landing page component
    └── CustomerForm.js # Application form component
```

## Getting Started

### Installation

1. Navigate to the project directory:
```bash
cd "c:\Users\daspa\Desktop\Sample web"
```

2. Install dependencies:
```bash
npm install
```

### Running the App

Start the development server:
```bash
npm start
```

The app will open in your browser at `http://localhost:3000`

### Building for Production

```bash
npm build
```

## Technologies Used

- React 18.2.0
- React Router DOM 6.14.0
- CSS3 for styling

## Features

✓ Responsive design (works on mobile, tablet, desktop)
✓ Form validation with user-friendly error messages
✓ Smooth transitions and hover effects
✓ Success confirmation feedback
✓ Clean, modern UI with gradient backgrounds
✓ Easy navigation between pages

## How to Use

1. **Landing Page**: Users see the welcome screen with information about the credit card benefits
2. **Get Started Button**: Clicking this navigates to the application form
3. **Fill Form**: Users enter their personal and financial information
4. **Validation**: Form validates all required fields
5. **Submit**: Upon submission, a success message appears and user is redirected to landing page

## Customization

You can easily customize:
- Colors in `App.css`
- Landing page content in `pages/LandingPage.js`
- Form fields in `pages/CustomerForm.js`
- Validation rules in `CustomerForm.js`
- State options in the state dropdown
- Income ranges in the income dropdown
