import "./globals.css";
import { Inter, Lora } from "next/font/google";
import Footer from "@/components/Footer/Footer";
import Sidebar from "@/components/sidebar/Sidebar";
import BottomBar from "@/components/bottomBar/BottomBar";
import NoteModal from "@/components/createNote/NoteModal";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { CreateNoteProvider } from "@/context/CreateNoteContext";
import ThemeProvider from "@/providers/ThemeProvider";
import AuthProvider from "@/providers/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

export const metadata = {
  title: "WriteSpace",
  description: "Your space to write, read, and share ideas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeContextProvider>
            <ThemeProvider>
              <CreateNoteProvider>
                <div className="container">
                  <Sidebar />
                  <BottomBar />
                  <NoteModal />
                  <main className="mainContent">
                    {children}
                    <Footer />
                  </main>
                </div>
              </CreateNoteProvider>
            </ThemeProvider>
          </ThemeContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}