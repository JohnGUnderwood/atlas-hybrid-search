import dynamic from 'next/dynamic';

const LoadingIndicator = dynamic(
  () => import('@leafygreen-ui/loading-indicator').then(mod => mod.Spinner),
  { ssr: false }
);

export default LoadingIndicator; 