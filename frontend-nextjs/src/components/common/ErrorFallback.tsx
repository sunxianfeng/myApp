'use client';

import React from 'react';
import { Button, Result } from 'antd';

interface ErrorFallbackProps {
  error?: Error;
  reset: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, reset }) => {
  return (
    <Result
      status="error"
      title="Something went wrong"
      subTitle="Sorry, an unexpected error has occurred."
      extra={[
        <Button type="primary" key="retry" onClick={reset}>
          Try Again
        </Button>,
        <Button key="reload" onClick={() => window.location.reload()}>
          Reload Page
        </Button>,
      ]}
    >
      {process.env.NODE_ENV === 'development' && error && (
        <div className="desc">
          <pre style={{ whiteSpace: 'pre-wrap' }}>{error.stack}</pre>
        </div>
      )}
    </Result>
  );
};

export default ErrorFallback;
