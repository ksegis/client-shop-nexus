
interface PortalIndicatorProps {
  portalType: 'customer' | 'shop';
}

export const PortalIndicator = ({ portalType }: PortalIndicatorProps) => {
  return (
    <div className={`py-1 text-center text-white text-xs font-medium ${portalType === 'customer' ? 'bg-shop-primary' : 'bg-shop-dark'}`}>
      {portalType === 'customer' ? 'CUSTOMER PORTAL' : 'SHOP MANAGEMENT PORTAL'}
    </div>
  );
};
