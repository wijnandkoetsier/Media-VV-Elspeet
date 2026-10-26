import { useEffect, useState } from 'react';
import { Editor } from './components/Editor';
import { TemplatePicker } from './components/TemplatePicker';
import { templateById } from './templates';

const readHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));

export function App() {
  // De hash (#/matchday) houdt bij welk template open is, zodat de terugknop van de telefoon werkt.
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    const onHash = () => setRoute(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const tpl = templateById(route);
  if (tpl) return <Editor key={tpl.id} tpl={tpl} onBack={() => history.length > 1 ? history.back() : (location.hash = '')} />;
  return <TemplatePicker onPick={(id) => (location.hash = `/${id}`)} />;
}
