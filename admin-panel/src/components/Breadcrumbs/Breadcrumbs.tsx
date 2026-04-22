import { Link, useLocation } from 'react-router-dom';

export const Breadcrumbs = () => {
  const location = useLocation();

  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm">
      <Link
        to="/dashboard"
        className="text-gray-500 dark:text-gray-400 no-underline hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
      >
        Dashboard
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        // Check if the segment is likely an ID (24 hex chars for Mongo, or 36 chars for UUID)
        const isId = /^[a-fA-F0-9]{24}$/.test(name) || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(name);
        
        const displayName = isId 
          ? 'Details' 
          : name.charAt(0).toUpperCase() + name.slice(1);

        return (
          <span key={routeTo}>
            <span className="text-gray-500 dark:text-gray-400"> / </span>
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-medium">
                {displayName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="text-gray-500 dark:text-gray-400 no-underline hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                {displayName}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};
