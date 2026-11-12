import { Link } from 'react-router-dom';
import { Leaf, Scan, Brain, TrendingUp, Shield, Users, BookOpen, ArrowRight, BarChart2, History as HistoryIcon } from 'lucide-react';
import { DISEASE_LIBRARY } from '../data/diseases';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <nav className="border-b border-forest-900/8 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="section-wrapper">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-900 to-forest-700 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-tv-primary">
                TeaVision AI
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to="/dashboard"
                className="text-xs sm:text-sm font-medium text-tv-secondary hover:text-tv-primary flex items-center gap-1.5 transition-colors"
              >
                <BarChart2 className="w-4 h-4 text-forest-700" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link
                to="/history"
                className="text-xs sm:text-sm font-medium text-tv-secondary hover:text-tv-primary flex items-center gap-1.5 transition-colors"
              >
                <HistoryIcon className="w-4 h-4 text-forest-700" />
                <span className="hidden md:inline">History</span>
              </Link>
              <Link
                to="/diseases"
                className="text-xs sm:text-sm font-medium text-tv-secondary hover:text-tv-primary flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-forest-700" />
                <span className="hidden sm:inline">Library</span>
              </Link>
              <Link to="/scan" className="btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4">
                <Scan className="w-4 h-4" />
                <span>Scan Leaf</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section-wrapper py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-forest-100 text-forest-800 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Brain className="w-4 h-4" />
            Powered by LightTeaNet-ECA
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-tv-primary mb-6 leading-tight">
            Understand Your Tea Leaves.<br />
            Protect Your Plantation.
          </h1>

          <p className="text-lg sm:text-xl text-tv-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered tea leaf disease detection designed to support smarter plantation monitoring and agricultural research.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/scan" className="btn-primary text-base px-6 py-3">
              <Scan className="w-5 h-5" />
              Scan a Tea Leaf
            </Link>
            <a href="#how-it-works" className="btn-secondary text-base px-6 py-3">
              Explore Technology
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-wrapper py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-tv-primary mb-4">
            How It Works
          </h2>
          <p className="text-lg text-tv-secondary max-w-2xl mx-auto">
            Advanced deep learning technology in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-forest-100 flex items-center justify-center mx-auto mb-4">
              <Scan className="w-7 h-7 text-forest-700" />
            </div>
            <h3 className="font-display text-xl font-semibold text-tv-primary mb-3">
              1. Capture or Upload
            </h3>
            <p className="text-tv-secondary">
              Take a photograph of a tea leaf using your mobile camera or upload an existing image.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-forest-100 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-7 h-7 text-forest-700" />
            </div>
            <h3 className="font-display text-xl font-semibold text-tv-primary mb-3">
              2. AI Analysis
            </h3>
            <p className="text-tv-secondary">
              Our lightweight LightTeaNet-ECA model processes the image instantly using efficient channel attention.
            </p>
          </div>

          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-forest-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-forest-700" />
            </div>
            <h3 className="font-display text-xl font-semibold text-tv-primary mb-3">
              3. Get Results
            </h3>
            <p className="text-tv-secondary">
              Receive disease classification, confidence scores, and management guidance within seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Disease Categories */}
      <section className="bg-white py-16 lg:py-24">
        <div className="section-wrapper">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-tv-primary mb-4">
              Disease Categories
            </h2>
            <p className="text-lg text-tv-secondary max-w-2xl mx-auto">
              Our model identifies seven classes of tea leaf conditions
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(DISEASE_LIBRARY).map((item) => (
              <Link
                key={item.id}
                to={`/diseases#${item.id}`}
                className="card p-5 flex flex-col justify-between hover:shadow-card-lg hover:border-forest-600/40 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-forest-100 flex items-center justify-center flex-shrink-0 group-hover:bg-forest-200 transition-colors">
                    <Leaf className="w-5 h-5 text-forest-700" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-tv-primary block group-hover:text-forest-800 transition-colors">
                      {item.className}
                    </span>
                    <span className="text-[11px] text-tv-secondary">
                      {item.categoryLabel}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] font-medium text-forest-700 flex items-center gap-1 mt-2 pt-2 border-t border-forest-900/5">
                  <span>View symptoms</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/diseases"
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Complete Disease Library</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="section-wrapper py-16 lg:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-tv-primary mb-4">
              Technology
            </h2>
            <p className="text-lg text-tv-secondary">
              Built on cutting-edge agricultural AI research
            </p>
          </div>

          <div className="card p-8 space-y-6">
            <div>
              <h3 className="font-display text-xl font-semibold text-tv-primary mb-2">
                LightTeaNet-ECA Architecture
              </h3>
              <p className="text-tv-secondary leading-relaxed">
                Our lightweight depthwise-separable convolutional neural network with Efficient Channel Attention (ECA) achieves 87.50% test accuracy with only 101,940 parameters.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 pt-4">
              <div>
                <div className="text-3xl font-bold text-forest-700 mb-1">101K</div>
                <div className="text-sm text-tv-secondary">Parameters</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-forest-700 mb-1">87.5%</div>
                <div className="text-sm text-tv-secondary">Test Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-forest-700 mb-1">224×224</div>
                <div className="text-sm text-tv-secondary">Input Size</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 lg:py-24">
        <div className="section-wrapper">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-tv-primary mb-4">
              Platform Features
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-tv-primary mb-2">
                  Instant Detection
                </h3>
                <p className="text-tv-secondary text-sm">
                  Get disease classification results in real-time with confidence scores and top predictions.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-tv-primary mb-2">
                  Field Research Support
                </h3>
                <p className="text-tv-secondary text-sm">
                  Contribute to real-world model evaluation through optional field observations and feedback.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-forest-700" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-tv-primary mb-2">
                  Mobile Optimized
                </h3>
                <p className="text-tv-secondary text-sm">
                  Capture and analyze tea leaves directly from your smartphone in the field.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-wrapper py-16 lg:py-24">
        <div className="card p-12 text-center max-w-3xl mx-auto bg-gradient-to-br from-forest-900 to-forest-800 text-white border-0">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-forest-100 text-lg mb-8 max-w-xl mx-auto">
            Start detecting tea leaf diseases with AI-powered analysis today.
          </p>
          <Link to="/scan" className="inline-flex items-center gap-2 bg-white text-forest-900 hover:bg-forest-50 font-medium px-6 py-3 rounded-xl transition-colors">
            <Scan className="w-5 h-5" />
            Scan Your First Leaf
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest-950 text-forest-200 py-12">
        <div className="section-wrapper">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              <span className="font-display font-semibold">TeaVision AI</span>
            </div>
            <p className="text-sm text-forest-300">
              Intelligence for healthier tea plantations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
