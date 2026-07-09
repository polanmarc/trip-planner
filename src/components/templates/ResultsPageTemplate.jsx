import React from 'react';

export const ResultsPageTemplate = ({ header, mainContent, sidebarContent }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    {header}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">{mainContent}</div>
      <div className="space-y-6">{sidebarContent}</div>
    </div>
  </div>
);