
export const EmptyPartsGrid = () => {
  return (
    <div className="py-12 text-center">
      <p className="text-lg text-muted-foreground">
        No parts found matching your criteria.
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Try adjusting your filters or search terms.
      </p>
    </div>
  );
};
