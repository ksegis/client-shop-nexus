
export const LoadingPartsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-md"></div>
      ))}
    </div>
  );
};
