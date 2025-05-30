import React from 'react';
import { Link } from 'react-router-dom';
import { FiBarChart3, FiHeart, FiGithub, FiMail } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-2 rounded-lg">
                <FiBarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Political Sentiment Tracker
                </h3>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              Track political candidate sentiment across social media and news sources in real-time. 
              Make informed decisions with comprehensive data analytics.
            </p>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <span>Made with</span>
              <FiHeart className="h-4 w-4 text-red-500" />
              <span>for democracy</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/leaderboard"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/login"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Information
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#about"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#methodology"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Methodology
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
                >
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-500">
              © {currentYear} Political Sentiment Tracker. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="GitHub"
              >
                <FiGithub className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@example.com"
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Email"
              >
                <FiMail className="h-5 w-5" />
              </a>
            </div>

            {/* Data Sources */}
            <div className="text-xs text-gray-400">
              Data from Reddit, Google Trends, and News APIs
            </div>
          </div>
        </div>
      </div>

      {/* Data Disclaimer */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-xs text-gray-500 text-center">
            <strong>Disclaimer:</strong> This tool provides sentiment analysis based on publicly available data. 
            Results are for informational purposes only and should not be considered as political advice or endorsements.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;