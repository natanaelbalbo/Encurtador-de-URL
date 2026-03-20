import { useState } from 'react';
import UrlForm from '../components/UrlForm';
import UrlList from '../components/UrlList';

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleUrlCreated() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div>
      <UrlForm onCreated={handleUrlCreated} />
      <UrlList refreshKey={refreshKey} />
    </div>
  );
}
