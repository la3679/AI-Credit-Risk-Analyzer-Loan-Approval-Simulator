# AI Credit Risk Analyzer & Loan Approval Simulator

A professional, high-performance financial technology suite designed for high-fidelity credit risk modeling, loan simulator scenarios, and automated financial intelligence synthesis.

![Financial Dashboard](https://picsum.photos/seed/fintech/1200/400)

## 🚀 Overview

The **AI Credit Risk Analyzer** is a state-of-the-art fintech platform that transforms complex financial datasets into actionable intelligence. By integrating a custom-developed **Logistic Regression ML Engine** with **Generative Synthesis**, the system delivers a comprehensive "Deep Risk Analysis." It characterizes applicant risk through a sophisticated multi-dimensional lens, considering income stability, debt obligations, and historical credit performance.

## ✨ Core Features

### 1. Advanced Risk Modeling
- **Instant Probabilistic Scoring**: Real-time calculation of approval probabilities using normalized logarithmic feature scaling.
- **Explainable Analysis (XAI)**: Breakdown of positive and negative risk factors, providing transparency into "Black Box" predictions.
- **Dynamic Interest Rate Simulation**: Automated calculation of suggested APR based on the derived risk category.

### 2. Comprehensive Intelligence
- **Deep Synthesis Reports**: Automated generation of senior-level financial narratives using generative intelligence.
- **Strategic Action Plans**: Priority-ranked suggestions (High/Medium/Low) for improving an applicant's financial standing.
- **Atmospheric Data Visualization**: Interactive charts for Credit Score Trends and Debt Reduction trajectories.

### 3. Profile & Portfolio Management
- **Persistent Cloud Storage**: full integration with Firestore for secure, real-time profile persistence.
- **Multi-Profile Comparison**: Side-by-side analysis of different saved financial scenarios.
- **Professional PDF Exports**: Generate high-quality, branded reports for offline review or distribution.

---

## 🛠️ Technical Architecture

### Frontend Ecosystem
- **Framework**: React 19 (Concurrent Mode)
- **State Management**: React Context & Hooks for localized state orchestration.
- **Data Visualization**: Recharts (Custom D3 implementation) for responsive, hardware-accelerated charting.
- **Animations**: Framer Motion for cinematic UI transitions and interactive feedback loops.
- **Styling**: Tailwind CSS 4.0 with customized "Neo-Fintech" atmospheric theme.

### Server-Side Infrastructure
- **Runtime**: Node.js with Express.js integration.
- **ML Layer**: Custom TypeScript-based Linear Algebra implementation for Logistic Regression.
- **Database**: Firebase Firestore (NoSQL) with sub-collection isolation.
- **Authentication**: Firebase Identity Platform (OIDC / Google OAuth).
- **Intelligence Layer**: Large Language Model integration for narrative synthesis.

---

## 🧠 Machine Learning Engine: Under the Hood

The predictive heart of the application is an optimized **Logistic Regression** model. Unlike standard implementations, this engine is optimized for sub-millisecond execution directly within the financial pipeline.

### Feature Normalization
The engine utilizes several normalization strategies to maintain model stability across diverse income brackets:
- **Income**: Normalized using $min(\frac{income}{200000}, 1)$ to isolate variance.
- **Credit Score**: Scaled to a [0, 1] range based on the FICO standard (300-850).
- **Ratios**: Real-time derivation of Debt-to-Income (DTI) and Loan-to-Income (LTI) coefficients.

### Weight Distribution
The model utilizes a conservative weight matrix derived from historical lending heuristics:
| Feature | Weight | Role |
| :--- | :--- | :--- |
| **Credit Score** | +4.0 | Reliability Coefficient |
| **Income** | +2.5 | Liquidity Coefficient |
| **DTI (Debt)** | -3.5 | Obligation Penalty |
| **LTI (Loan)** | -2.0 | Exposure Penalty |
| **Age** | +0.5 | Stability Factor |

---

## 📁 Project Structure

```text
├── server.ts              # Entry point for Express & Vite middleware
├── firebase-blueprint.json # IR representation of the data schema
├── firestore.rules        # Hardened security rules for database access
├── src/
│   ├── App.tsx            # Main application layout & route orchestration
│   ├── components/        # Reusable UI architecture
│   │   ├── ui/            # Atomic shadcn/ui components
│   │   ├── InsightsPanel  # Cinematic AI synthesis display
│   │   ├── RiskGauge      # Advanced SVG-based risk visualization
│   │   ├── CreditTimeline # Interactive Recharts implementation
│   │   └── ComparisonView # Side-by-side scenario analyzer
│   ├── lib/               # Core business logic
│   │   ├── ml.ts          # Custom ML Model implementation
│   │   ├── riskService.ts # Risk calculation orchestration
│   │   └── firebase.ts    # Firebase SDK initialization
│   └── types.ts           # Global TypeScript interface definitions
```

---

## 🛰️ API Documentation

### `POST /api/predict-risk`
Calculates the probability of loan approval based on financial inputs.
- **Payload**: `FinancialData` object.
- **Returns**: `RiskResult` including score, category, and explainable factors.

### `POST /api/suggest-improvements`
Generates actionable strategic advice based on financial variance.
- **Payload**: `FinancialData` object.
- **Returns**: Array of `ImprovementSuggestion` objects.

---

## 🏃‍♂️ Local Development Setup

### Prerequisites
- Node.js v18.x or v20.x
- Firebase account with a Firestore instance
- Generative AI API Key

### Installation

1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   cd credit-risk-analyzer
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   # Generative AI Key
   GEMINI_API_KEY=your_key_here

   # Firebase Configuration (Client-side)
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Launch**:
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:3000`.

---

## 🌐 Deployment Guidelines

### Netlify Deployment
The project includes a `netlify.toml` for seamless deployment.
1. Connect your repo to Netlify.
2. Ensure the **Build Command** is set to `npm run build`.
3. Set the **Publish Directory** to `dist`.
4. Add all environment variables from your `.env` file to the Netlify environment settings.

---

## 🛡️ Security & Data Privacy

### Hardened Firestore Rules
The application utilizes a **Zero-Trust** security model for data access:
- **Identity Isolation**: Users can only read/write documents where the `uid` matches their authenticated session.
- **Schema Validation**: Every write operation is validated against a strict entity schema using custom rule functions.
- **PII Isolation**: Financial data is stored in user-specific sub-collections to ensure total data segregation.

### Operational Security
- **Server-Side ML**: Prediction logic is executed on the server, preventing client-side tempering of results.
- **Rate Limiting**: Integrated protections to prevent brute-force risk analysis attempts.
