// src/component/ShareModal.tsx

import React from 'react';
import { FaFacebook, FaPinterest, FaTwitter } from 'react-icons/fa'; // Make sure you have react-icons installed

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, imageUrl }) => {
  if (!isOpen || !imageUrl) return null;

  const shareText = "Check out the cool name art I made on NameDesignAI! Create your own here:";
  const websiteUrl = "https://www.namedesignai.com"; // Your actual website URL

  // Encode components for safe URL creation
  const encodedShareText = encodeURIComponent(shareText);
  const encodedWebsiteUrl = encodeURIComponent(websiteUrl);
  const encodedImageUrl = encodeURIComponent(imageUrl);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedWebsiteUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedWebsiteUrl}&text=${encodedShareText}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedWebsiteUrl}&media=${encodedImageUrl}&description=${encodedShareText}`,
  };

  const handleShareClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose} // Close modal when clicking the overlay
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h3 className="text-xl font-semibold text-center mb-6">Share your design!</h3>
        <div className="flex justify-around items-center gap-4">
          {/* Facebook Button */}
          <button
            onClick={() => handleShareClick(shareUrls.facebook)}
            className="flex flex-col items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Share on Facebook"
          >
            <FaFacebook size={40} />
            <span>Facebook</span>
          </button>

          {/* Twitter (X) Button */}
          <button
            onClick={() => handleShareClick(shareUrls.twitter)}
            className="flex flex-col items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
            title="Share on X"
          >
            <FaTwitter size={40} />
            <span>X</span>
          </button>

          {/* Pinterest Button */}
          <button
            onClick={() => handleShareClick(shareUrls.pinterest)}
            className="flex flex-col items-center justify-center gap-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Pin on Pinterest"
          >
            <FaPinterest size={40} />
            <span>Pinterest</span>
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full mt-8 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};