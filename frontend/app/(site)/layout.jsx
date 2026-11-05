import SiteLayout from '../../components/site/SiteLayout';
export default function Layout({ children }) {
  return (
    <>
      <link rel="stylesheet" href="/site.css" />
      <SiteLayout>{children}</SiteLayout>
    </>
  );
}
