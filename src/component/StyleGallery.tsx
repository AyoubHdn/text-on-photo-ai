// ~/component/StyleGallery.tsx
import React, { useState } from 'react';
import Image from 'next/image';

// --- Type Definitions for the component's props ---
interface GalleryItem {
  src: string;
  title: string;
  tags: string[];
}

interface GalleryTab {
  key: string;
  name: string;
}

interface StyleGalleryProps {
  galleryItems: GalleryItem[];
  galleryTabs: GalleryTab[];
}

export const StyleGallery: React.FC<StyleGalleryProps> = ({ galleryItems, galleryTabs }) => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles = activeTab === "all"
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(activeTab));

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore a World of Creative Styles</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          Find the perfect aesthetic for your name, brand, or project.
        </p>
        
        <div className="flex justify-center flex-wrap gap-2 mb-12">
          {galleryTabs.map(tab => (
            <button 
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                  activeTab === tab.key 
                  ? 'bg-blue-500 text-white shadow' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredStyles.map((style) => (
            <div key={style.src} className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer">
              <img src={style.src} alt={style.title} className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-lg font-semibold text-center px-2">{style.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};