
import { Link } from 'react-router-dom';

interface LogoProps {
  portalType: 'customer' | 'shop';
}

export const Logo = ({ portalType }: LogoProps) => {
  return (
    <div className="flex items-center">
      <Link to={portalType === 'customer' ? '/customer' : '/shop'}>
        <div className="h-10 w-40 bg-shop-light flex items-center justify-center text-shop-primary font-bold">
          LOGO PLACEHOLDER
        </div>
      </Link>
    </div>
  );
};
