import MarketingNav from "./components/MarketingNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing">
      <MarketingNav transparent />
      {children}
    </div>
  );
}
