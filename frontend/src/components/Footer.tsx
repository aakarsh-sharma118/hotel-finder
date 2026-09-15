import React from 'react';
import { Code2, GitBranch } from 'lucide-react';
import { useHotelStore } from '../store/useHotelStore';
import { useUrlRouting } from '../hooks/useUrlRouting';
import { PAGE_STRINGS } from '../constants/pageStrings';
import BrandLogo from './common/BrandLogo';

/**
 * Site footer with brand info, navigation, legal modals,
 * and a dedicated Developer section for API Docs and Source Code.
 */
export const Footer: React.FC = () => {
  const { setPolicyModal } = useHotelStore();
  const { navigateToTab } = useUrlRouting();

  // Navigate to a tab and scroll to top
  const handleNav = (tab: 'search' | 'bookings') => {
    navigateToTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="corporate-footer" data-testid="footer">
      {/* Main link columns */}
      <div className="footer-columns-grid">
        {/* Brand column */}
        <div className="footer-brand-col">
          <BrandLogo size="md" />
          <p className="footer-brand-desc">{PAGE_STRINGS.footer.about}</p>
          <span className="company-legal-name">{PAGE_STRINGS.footer.company}</span>
        </div>

        {/* Platform navigation */}
        <div className="footer-links-col">
          <h4>{PAGE_STRINGS.footer.headings.platform}</h4>
          <ul>
            <li>
              <button type="button" onClick={() => handleNav('search')}>
                {PAGE_STRINGS.footer.links.searchStays}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => handleNav('bookings')}>
                {PAGE_STRINGS.footer.links.myReservations}
              </button>
            </li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="footer-links-col">
          <h4>{PAGE_STRINGS.footer.headings.supportLegal}</h4>
          <ul>
            <li>
              <button type="button" onClick={() => setPolicyModal('privacy')}>
                {PAGE_STRINGS.footer.links.privacy}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setPolicyModal('terms')}>
                {PAGE_STRINGS.footer.links.terms}
              </button>
            </li>
          </ul>
        </div>

        {/* Developer — API Docs and Source Code */}
        <div className="footer-links-col">
          <h4>{PAGE_STRINGS.footer.headings.developer}</h4>
          <ul>
            <li>
              {/* Opens Swagger UI in a new tab */}
              <a
                href="/api-docs"
                target="_blank"
                rel="noreferrer"
                className="footer-dev-link"
              >
                <Code2 size={13} />
                {PAGE_STRINGS.footer.links.apiDocs}
              </a>
            </li>
            <li>
              {/* Opens the GitHub repository in a new tab */}
              <a
                href="https://github.com/aakarsh-sharma118/hotel-finder"
                target="_blank"
                rel="noreferrer"
                className="footer-dev-link"
              >
                <GitBranch size={13} />
                {PAGE_STRINGS.footer.links.sourceCode}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="footer-bottom-bar">
        <p className="footer-copyright-text">{PAGE_STRINGS.footer.copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;
