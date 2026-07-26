import FullScreenLoader from '@/components/ui/FullScreenLoader';

export default function LoginLoading() {
  return <FullScreenLoader minDisplayMs={400} label="Preparing login…" />;
}
