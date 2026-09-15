import React, { useState } from 'react';
import { Search, BookOpen, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useHotelStore, AppTab } from '../store/useHotelStore';
import { useUrlRouting } from '../hooks/useUrlRouting';
import { PAGE_STRINGS } from '../constants/pageStrings';
import BrandLogo from './common/BrandLogo';

// Site-wide header with navigation tabs and theme toggle.
// API Docs and Source Code links are in the Footer Developer section.
export const Header: React.FC = () => {
  const { toggleTheme, isDark } = useTheme();
  const { activeTab, bookings } = useHotelStore();
  const { navigateToTab } = useUrlRouting();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigate to a tab and close the mobile menu
  const handleNavClick = (tab: AppTab) => {
    navigateToTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Count only confirmed bookings for the badge
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;

  return (
    <header className="site-header">
      {/* Logo — clicking navigates to the Search tab */}
      <div className="header-brand" onClick={() => handleNavClick('search')} style={{ cursor: 'pointer' }}>
        <BrandLogo size="md" />
      </div>

      {/* Desktop and expanded-mobile navigation */}
      <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <button
          type="button"
          className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleNavClick('search')}
        >
          <Search size={15} /> {PAGE_STRINGS.nav.search}
        </button>

        <button
          type="button"
          className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => handleNavClick('bookings')}
        >
          <BookOpen size={15} /> {PAGE_STRINGS.nav.bookings}
          {/* Show confirmed booking count badge when non-zero */}
          {confirmedCount > 0 && <span className="nav-badge-count">{confirmedCount}</span>}
        </button>

        {/* Theme toggle — hidden on mobile (mobile has its own button below) */}
        <button
          type="button"
          className="theme-toggle-btn desktop-theme-btn"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-label={PAGE_STRINGS.nav.themeToggleLabel}
          data-testid="theme-toggle-btn"
        >
          {isDark ? (
            <>
              <Sun size={15} className="theme-icon sun-icon" />
              <span className="theme-text">{PAGE_STRINGS.nav.lightMode}</span>
            </>
          ) : (
            <>
              <Moon size={15} className="theme-icon moon-icon" />
              <span className="theme-text">{PAGE_STRINGS.nav.darkMode}</span>
            </>
          )}
        </button>
      </nav>

      {/* Mobile action bar: theme toggle + hamburger */}
      <div className="mobile-header-actions">
        <button
          type="button"
          className="theme-toggle-btn mobile-theme-btn"
          onClick={toggleTheme}
          aria-label={PAGE_STRINGS.nav.themeToggleLabel}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={PAGE_STRINGS.nav.mobileMenuToggleLabel}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
