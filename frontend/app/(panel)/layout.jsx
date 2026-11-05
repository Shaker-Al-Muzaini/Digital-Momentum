import PanelLayout from '../../components/panel/PanelLayout';
export default function Layout({ children }) {
  return (
    <>
      <link rel="stylesheet" href="/panel.css" />
      <PanelLayout>{children}</PanelLayout>
    </>
  );
}
