# Healthcare Risk Assessment Dashboard

A modern, full-stack Next.js application for evaluating patient risk scores using the DemoMed Healthcare API. This project demonstrates advanced API integration, error handling with retry logic, data processing, and interactive dashboard visualization.

## 🎯 Project Overview

This assessment tool:
- Fetches patient data from a simulated healthcare API with pagination
- Implements intelligent retry logic for handling rate limits and transient failures
- Calculates risk scores based on blood pressure, temperature, and age
- Categorizes patients into high-risk, fever, and data quality issue groups
- Submits results for automated grading
- Displays comprehensive results with real-time progress tracking

## 🚀 Features

### Core Functionality
- ✅ **Complete Patient Data Retrieval** - Handles pagination (~50 patients across ~10 pages)
- ✅ **Robust Error Handling** - Exponential backoff retry logic for 429, 500, 503 errors
- ✅ **Risk Scoring Engine** - Accurate implementation of all scoring rules
- ✅ **Real-time Progress Tracking** - Live updates during data fetching and analysis
- ✅ **Interactive Dashboard** - Modern UI with detailed results visualization
- ✅ **Secure API Key Management** - Server-side only, never exposed to client

### Risk Assessment Criteria

#### Blood Pressure Scoring
- **Normal** (Systolic <120 AND Diastolic <80): 1 point
- **Elevated** (Systolic 120-129 AND Diastolic <80): 2 points
- **Stage 1** (Systolic 130-139 OR Diastolic 80-89): 3 points
- **Stage 2** (Systolic ≥140 OR Diastolic ≥90): 4 points
- **Invalid/Missing**: 0 points

#### Temperature Scoring
- **Normal** (≤99.5°F): 0 points
- **Low Fever** (99.6-100.9°F): 1 point
- **High Fever** (≥101.0°F): 2 points
- **Invalid/Missing**: 0 points

#### Age Scoring
- **Under 40** (<40 years): 1 point
- **40-65** (40-65 years, inclusive): 1 point
- **Over 65** (>65 years): 2 points
- **Invalid/Missing**: 0 points

### Patient Categorization
- **High-Risk**: Total risk score ≥ 4
- **Fever**: Temperature ≥ 99.6°F
- **Data Quality Issues**: Any invalid/missing BP, age, or temperature

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: Biome

### Project Structure

```
healthcare-api/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── fetch-patients/
│   │   │   │   └── route.ts          # Server-side patient data fetching
│   │   │   └── submit-assessment/
│   │   │       └── route.ts          # Server-side assessment submission
│   │   ├── page.tsx                  # Main dashboard UI
│   │   ├── layout.tsx                # Root layout with metadata
│   │   └── globals.css               # Global styles
│   ├── lib/
│   │   ├── api-client.ts             # API integration with retry logic
│   │   ├── risk-scoring.ts           # Risk calculation engine
│   │   └── utils.ts                  # Helper functions
│   └── types/
│       └── assessment.ts             # TypeScript type definitions
├── .env.local                        # Environment variables (API key)
├── .env.example                      # Environment template
├── package.json
└── README.md
```

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and add your API key:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   API_KEY=your_api_key_here
   API_BASE_URL=https://assessment.ksensetech.com/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

1. Click **"Start Assessment"** to begin
2. Watch real-time progress as data is fetched and analyzed
3. Review the patient data table with calculated risk scores
4. See detailed assessment results with score breakdown
5. View feedback on strengths and areas for improvement
6. Use **"Run New Assessment"** or **"Reset"** to start over

## 🔧 Key Implementation Details

### Retry Logic
- **Maximum Retries**: 3 attempts per request
- **Exponential Backoff**: 1s, 2s, 4s delays
- **Retryable Errors**: 429 (rate limit), 500, 503 (server errors)

### Data Validation
- Defensive parsing for all patient fields
- Comprehensive null/undefined handling
- Edge case management (e.g., "150/" or "/90" for blood pressure)
- Type guards for runtime safety

### Security
- API key stored server-side only (`.env.local`)
- Never exposed to client-side code
- Server-side API routes act as secure proxy

### Performance
- Efficient pagination handling (5 patients per page)
- Minimal React re-renders
- Optimized state management

## 📊 Assessment Grading

The system submits results and receives:
- **Overall Score**: Out of 100 points
- **Breakdown by Category**:
  - High-Risk Patients: 50 points max
  - Fever Patients: 25 points max
  - Data Quality Issues: 25 points max
- **Feedback**: Strengths and improvement areas
- **Attempts**: Up to 3 submission attempts

## 🧪 Testing

To verify the implementation:

1. Check that all patients are fetched (should be ~50 patients)
2. Verify risk scores are calculated correctly
3. Confirm categorization matches expected results
4. Review submission score and feedback
5. Test error handling by observing retry behavior

## 📝 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Format code
npm run format
```

## 🐛 Troubleshooting

### API Key Issues
- Ensure `.env.local` exists and contains valid `API_KEY`
- Restart dev server after changing environment variables

### Fetch Failures
- Check internet connection
- Verify API base URL is correct
- Review browser console for detailed error messages

### Styling Issues
- Clear browser cache
- Ensure Tailwind CSS is properly configured
- Check for conflicting global styles

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Biome Linter](https://biomejs.dev/)

## 🎓 Assessment Context

This project was created as part of a coding assessment to demonstrate:
- API integration skills
- Error handling and retry logic implementation
- Data processing and validation
- TypeScript proficiency
- React/Next.js expertise
- UI/UX design capabilities
- Code organization and documentation

**Note**: This uses simulated test data created specifically for assessment purposes only.

## 📄 License

This project is created for educational and assessment purposes.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS

