import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  onClick,
  ...props 
}) => {
  const cardClasses = `
    bg-white dark:bg-gray-800 
    rounded-lg shadow-sm 
    border border-gray-200 dark:border-gray-700
    ${hover ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    transition-all duration-200
    ${className}
  `;

  const MotionCard = motion.div;

  return (
    <MotionCard
      className={cardClasses}
      onClick={onClick}
      whileHover={hover ? { y: -2, scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </MotionCard>
  );
};

export default Card;