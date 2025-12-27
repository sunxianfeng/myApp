import React from 'react';

/**
 * MistakeBookStarIcon - A Neobrutalism-style logo representing a "Mistake Book" with a star
 * Follows the app's design system: Neo-Purple background, Neo-Yellow star, hard borders & shadows
 */
const MistakeBookStarIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`mistake-book-icon ${className}`}>
      {/* Centered Yellow Star with Neobrutalist weight */}
      <div className="mistake-book-star-container">
        ★
      </div>
      
      {/* Decorative text lines representing "mistakes" recorded in the book */}
      <div className="mistake-book-text-lines">
        <div className="mistake-book-line"></div>
        <div className="mistake-book-line short"></div>
        <div className="mistake-book-line"></div>
      </div>
    </div>
  );
};

export default MistakeBookStarIcon;
