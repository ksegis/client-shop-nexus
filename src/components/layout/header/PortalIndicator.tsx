
interface PortalIndicatorProps {
  portalType: 'shop';
}

export const PortalIndicator = ({ portalType }: PortalIndicatorProps) => {
  return (
    <div className="py-1 text-center text-white text-xs font-medium bg-shop-dark">
      SHOP MANAGEMENT PORTAL
    </div>
  );
};
