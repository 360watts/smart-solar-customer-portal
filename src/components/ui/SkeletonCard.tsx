import React from "react";

export default function SkeletonCard() {
  return (
    <div className="glass-green rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-4 bg-muted rounded w-20 mb-2"></div>
          <div className="h-8 bg-muted rounded w-32"></div>
        </div>
        <div className="w-12 h-12 bg-muted rounded-lg"></div>
      </div>
      <div className="h-4 bg-muted rounded w-24"></div>
    </div>
  );
}
