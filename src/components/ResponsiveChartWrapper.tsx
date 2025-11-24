import React, { ReactNode, useEffect, useState } from 'react';
import { getViewportDimensions } from '../utils/touchGestures';
import './ResponsiveChartWrapper.css';

interface ResponsiveChartWrapperProps {
  children: ReactNode;
  title?: string;
  minHeight?: number;
}

const ResponsiveChartWrapper: React.FC<ResponsiveChartWrapperProps> = ({
  children,
  title,
  minHeight = 300,
}) => {
  const [viewport, setViewport] = useState(getViewportDimensions());

  useEffect(() => {
    const handleResize = () => {
      setViewport(getViewportDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="responsive-chart-wrapper">
      {title && <h3 className="chart-title">{title}</h3>}
      <div
        className="chart-content"
        style={{
          minHeight: viewport.isMobile ? minHeight * 0.7 : minHeight,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ResponsiveChartWrapper;
