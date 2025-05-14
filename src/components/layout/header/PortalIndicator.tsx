
interface PortalIndicatorProps {
  portalType: 'shop' | 'customer';
}

export const PortalIndicator = ({ portalType }: PortalIndicatorProps) => {
  const indicatorText = portalType === 'shop' 
    ? 'SHOP MANAGEMENT PORTAL' 
    : 'CTC CUSTOMER PORTAL';
  
  const bgColorClass = portalType === 'shop' 
    ? 'bg-shop-dark' 
    : 'bg-shop-primary';
  
  return (
    <div className={`py-1 text-center text-white text-xs font-medium ${bgColorClass}`}>
      {indicatorText}
    </div>
  );
};
