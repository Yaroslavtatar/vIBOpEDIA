import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { SearchModal } from './components/SearchModal.js';
import { AuthModal } from './components/AuthModal.js';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.js';
import { api } from './api/client.js';

// Pages
import { HomePage } from './pages/HomePage.js';
import { ArticleViewPage } from './pages/ArticleViewPage.js';
import { ArticleEditPage } from './pages/ArticleEditPage.js';
import { ArticleHistoryPage } from './pages/ArticleHistoryPage.js';
import { ArticleDiscussionPage } from './pages/ArticleDiscussionPage.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { SearchPage } from './pages/SearchPage.js';
import { ModerationPage } from './pages/ModerationPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { UserProfilePage } from './pages/UserProfilePage.js';
import { BookmarksPage } from './pages/BookmarksPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { StaticInfoPage } from './pages/StaticInfoPages.js';
import { DevelopersPage } from './pages/DevelopersPage.js';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vibopedia_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('vibopedia_theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate('/articles/new');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate('/');
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        try {
          const res = await api.getRandomArticleSlug();
          navigate(`/articles/${res.slug}`);
        } catch {
          navigate('/articles');
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route matching logic
  const renderRoute = () => {
    const path = currentPath;

    if (path === '/' || path === '') {
      return (
        <HomePage
          onNavigate={navigate}
          onOpenSearch={() => setSearchOpen(true)}
        />
      );
    }

    if (path === '/developers') {
      return <DevelopersPage onNavigate={navigate} />;
    }

    if (path === '/categories') {
      return <CategoriesPage onNavigate={navigate} />;
    }

    if (path.startsWith('/categories/')) {
      const slug = path.replace('/categories/', '');
      return <CategoriesPage categorySlug={slug} onNavigate={navigate} />;
    }

    if (path === '/articles/new') {
      return <ArticleEditPage onNavigate={navigate} />;
    }

    if (path.startsWith('/articles/') && path.endsWith('/edit')) {
      const slug = path.replace('/articles/', '').replace('/edit', '');
      return <ArticleEditPage slug={slug} onNavigate={navigate} />;
    }

    if (path.startsWith('/articles/')) {
      const slug = path.replace('/articles/', '');
      return <ArticleViewPage slug={slug} onNavigate={navigate} />;
    }

    if (path.startsWith('/article/') && path.endsWith('/history')) {
      const slug = path.replace('/article/', '').replace('/history', '');
      return <ArticleHistoryPage slug={slug} onNavigate={navigate} />;
    }

    if (path.startsWith('/article/') && path.endsWith('/discussion')) {
      const slug = path.replace('/article/', '').replace('/discussion', '');
      return <ArticleDiscussionPage slug={slug} onNavigate={navigate} />;
    }

    if (path.startsWith('/search') || path === '/articles') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      const tag = params.get('tag') || '';
      return <SearchPage initialQuery={q} initialTag={tag} onNavigate={navigate} />;
    }

    if (path.startsWith('/user/')) {
      const username = path.replace('/user/', '');
      return <UserProfilePage username={username} onNavigate={navigate} />;
    }

    if (path === '/moderation') {
      return <ModerationPage onNavigate={navigate} />;
    }

    if (path === '/admin') {
      return <AdminPage onNavigate={navigate} />;
    }

    if (path === '/bookmarks') {
      return <BookmarksPage onNavigate={navigate} />;
    }

    if (path === '/notifications') {
      return <NotificationsPage onNavigate={navigate} />;
    }

    if (path === '/about') {
      return <StaticInfoPage type="about" />;
    }

    if (path === '/guidelines') {
      return <StaticInfoPage type="guidelines" />;
    }

    if (path === '/privacy') {
      return <StaticInfoPage type="privacy" />;
    }

    // Default Fallback
    return (
      <HomePage
        onNavigate={navigate}
        onOpenSearch={() => setSearchOpen(true)}
      />
    );
  };

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-slate-950 text-[#202122] dark:text-slate-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
        <Header
          onOpenSearch={() => setSearchOpen(true)}
          onNavigate={navigate}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          currentPath={currentPath}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPath}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderRoute()}
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />

        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onNavigate={navigate}
        />

        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
        />

        <KeyboardShortcutsModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
      </div>
    </AuthProvider>
  );
}
