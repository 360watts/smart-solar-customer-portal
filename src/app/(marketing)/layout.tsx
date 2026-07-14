import MarketingNav from "./components/MarketingNav";
import { CalculatorModal } from "./components/CalculatorModal";
import { CalculatorModalProvider } from "./lib/CalculatorModalContext";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CalculatorModalProvider>
      <div className="marketing">
        <MarketingNav transparent />
        {children}
        <CalculatorModal />
      </div>
    </CalculatorModalProvider>
  );
}
