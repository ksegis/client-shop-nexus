
import { Link } from 'react-router-dom';

interface NavigationLink {
  name: string;
  path: string;
}

interface DesktopNavigationProps {
  links: NavigationLink[];
  currentPath: string;
}

export const DesktopNavigation = ({ links, currentPath }: DesktopNavigationProps) => {
  return (
    <nav className="hidden md:flex space-x-6">
      {links.map((link) => (
        <Link 
          key={link.name}
          to={link.path}
          className={`text-gray-600 hover:text-shop-primary font-medium ${
            currentPath === link.path ? 'text-shop-primary' : ''
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
};
