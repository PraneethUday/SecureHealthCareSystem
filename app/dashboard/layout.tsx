import ChatWidget from "./components/chatbot/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Answers only from records the signed-in user is authorized to see. */}
      <ChatWidget />
    </>
  );
}
