import type { Metadata } from "next";
import { Oswald, Courier_Prime, Inter } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap"
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "ResumeRoaster — Free AI Resume Builder, Checker & ATS Optimizer",
  description: "Optimize your resume with our free AI ATS checker. Scan keyword match rates, rewrite bullets to the STAR method, and download parser-safe PDF templates instantly.",
  keywords: [
    "resume builder",
    "AI resume optimizer",
    "free resume checker",
    "ATS scanner",
    "STAR method resume",
    "resume maker",
    "resume score",
    "CV builder",
    "resume template",
    "ATS friendly template",
    "resume roast",
    "resume evaluator"
  ],
  authors: [{ name: "ResumeRoaster Team" }],
  creator: "ResumeRoaster",
  publisher: "ResumeRoaster",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    title: "ResumeRoaster — Free AI Resume Builder & ATS Checker",
    description: "Analyze your resume score, compare skill gaps with job descriptions, and write high-impact STAR accomplishments.",
    url: "https://resumeroaster.com",
    siteName: "ResumeRoaster",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://resumeroaster.com/icon.jpg",
        width: 1200,
        height: 630,
        alt: "ResumeRoaster - Free AI Resume Builder & ATS Checker"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeRoaster — Free AI Resume Builder",
    description: "Optimize your resume score and download clean, parser-safe A4 PDF templates in seconds.",
    creator: "@resumeroaster",
    images: ["https://resumeroaster.com/icon.jpg"]
  },
  alternates: {
    canonical: "https://resumeroaster.com"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${courierPrime.variable} ${inter.variable}`}>
      <head>
        <meta name="google-site-verification" content="YusRD1nslTUjBp07W4Ai1Ax19DtqHqLTkUs0wZmytaE" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ResumeRoaster",
              "url": "https://resumeroaster.com",
              "description": "Free AI-powered resume builder and ATS scanner. Optimize keyword density, polish bullet points with the STAR method, and export parser-safe PDF templates.",
              "applicationCategory": "EducationalApplication, BusinessApplication",
              "operatingSystem": "All",
              "screenshot": "https://resumeroaster.com/icon.jpg",
              "author": {
                "@type": "Organization",
                "name": "ResumeRoaster",
                "url": "https://resumeroaster.com"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1845"
              },
              "offers": {
                "@type": "Offer",
                "price": "0.00",
                "priceCurrency": "USD"
              },
              "featureList": [
                "AI STAR Method Bullet Polisher",
                "Free ATS Grade Scanner",
                "Interactive Keyword Gap Matcher",
                "Multi-Draft Local Auto-Saver",
                "Parser-Friendly PDF Resume Templates"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Free AI Resume Builder",
                  "item": "https://resumeroaster.com"
                }
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to optimize your resume for ATS scanners",
              "description": "Follow these simple steps to analyze, structure, and optimize your resume to pass enterprise Applicant Tracking Systems (ATS).",
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "Upload Resume PDF",
                  "text": "Upload your existing resume file or use our template builder presets to load sample data."
                },
                {
                  "@type": "HowToStep",
                  "name": "Paste Job Description",
                  "text": "Insert the target job details to compare terms, match core keywords, and find skills gaps."
                },
                {
                  "@type": "HowToStep",
                  "name": "Refactor Bullet Accomplishments",
                  "text": "Use the AI STAR method polisher to replace passive statements with active verb phrasing and quantifiable metrics."
                },
                {
                  "@type": "HowToStep",
                  "name": "Export ATS-Friendly PDF Layout",
                  "text": "Choose from Classic, Modern, or Elegant single-page layouts and download your print-ready PDF."
                }
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is ResumeRoaster completely free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! You can analyze, optimize, manually edit, and download your formatted A4 resumes as PDFs 100% free. No credit card, no sign-up, and no watermark."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does the AI bullet polish work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The AI STAR Polish reads your bullet statements, replaces weak starters with active verbs (like 'spearheaded' or 'architected'), and appends a metric to demonstrate impact, ensuring your resume speaks the language recruiters love."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Where is my resume details saved?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "All personal information and resume drafts are saved 100% locally in your browser's local storage. We do not store your data on external databases, keeping it completely private."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are the templates optimized for ATS parsers?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely. All templates are built using standard ATS-friendly heading hierachies, single-column layouts, and compliant font structures to guarantee maximum score extraction in Workday, Greenhouse, and Taleo."
                  }
                }
              ]
            })
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
