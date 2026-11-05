import { notFound } from 'next/navigation';
import PanelPage from '../../../../components/panel/PanelPage';
import nav from '../../../../lib/navigation.json';
export default async function Page({ params }) {
  const { page } = await params;
  if (!nav.some(([, items]) => items.some(([key]) => key === page))) notFound();
  return <PanelPage key={page} page={page} />;
}
